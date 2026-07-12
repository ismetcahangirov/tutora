import { Readable } from 'node:stream';
import type { Redis } from 'ioredis';
import { CacheService } from './cache.service';

function buildRedisMock() {
  return {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    scanStream: jest.fn(),
  };
}

function buildService(redis: ReturnType<typeof buildRedisMock>) {
  return new CacheService(redis as unknown as Redis);
}

describe('CacheService', () => {
  it('parses a stored JSON value on a hit', async () => {
    const redis = buildRedisMock();
    redis.get.mockResolvedValueOnce(JSON.stringify({ id: 'x', n: 1 }));

    const service = buildService(redis);
    await expect(service.get('k')).resolves.toEqual({ id: 'x', n: 1 });
  });

  it('returns null on a miss', async () => {
    const redis = buildRedisMock();
    redis.get.mockResolvedValueOnce(null);

    const service = buildService(redis);
    await expect(service.get('k')).resolves.toBeNull();
  });

  it('fails soft to a miss when Redis errors', async () => {
    const redis = buildRedisMock();
    redis.get.mockRejectedValueOnce(new Error('connection refused'));

    const service = buildService(redis);
    await expect(service.get('k')).resolves.toBeNull();
  });

  it('serialises and stores a value with a TTL', async () => {
    const redis = buildRedisMock();

    const service = buildService(redis);
    await service.set('k', { a: 1 }, 60);

    expect(redis.set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'EX', 60);
  });

  it('never throws when a write fails', async () => {
    const redis = buildRedisMock();
    redis.set.mockRejectedValueOnce(new Error('down'));

    const service = buildService(redis);
    await expect(service.set('k', 1, 60)).resolves.toBeUndefined();
  });

  describe('getOrSet', () => {
    it('returns the cached value without invoking the loader on a hit', async () => {
      const redis = buildRedisMock();
      redis.get.mockResolvedValueOnce(JSON.stringify(['cached']));
      const loader = jest.fn();

      const service = buildService(redis);
      const result = await service.getOrSet('k', 60, loader);

      expect(result).toEqual(['cached']);
      expect(loader).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('loads, caches and returns the value on a miss', async () => {
      const redis = buildRedisMock();
      redis.get.mockResolvedValueOnce(null);
      const loader = jest.fn().mockResolvedValue(['fresh']);

      const service = buildService(redis);
      const result = await service.getOrSet('k', 30, loader);

      expect(result).toEqual(['fresh']);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith('k', JSON.stringify(['fresh']), 'EX', 30);
    });

    it('does not cache when the loader rejects', async () => {
      const redis = buildRedisMock();
      redis.get.mockResolvedValueOnce(null);
      const loader = jest.fn().mockRejectedValue(new Error('db down'));

      const service = buildService(redis);
      await expect(service.getOrSet('k', 30, loader)).rejects.toThrow('db down');
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('is a no-op when no keys are given', async () => {
      const redis = buildRedisMock();
      const service = buildService(redis);

      await service.del();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('deletes the given keys', async () => {
      const redis = buildRedisMock();
      const service = buildService(redis);

      await service.del('a', 'b');
      expect(redis.del).toHaveBeenCalledWith('a', 'b');
    });
  });

  describe('deleteByPrefix', () => {
    it('scans by pattern and deletes each non-empty batch', async () => {
      const redis = buildRedisMock();
      redis.scanStream.mockReturnValue(Readable.from([['taxonomy:a', 'taxonomy:b'], []]));

      const service = buildService(redis);
      await service.deleteByPrefix('taxonomy:');

      expect(redis.scanStream).toHaveBeenCalledWith(
        expect.objectContaining({ match: 'taxonomy:*' }),
      );
      expect(redis.del).toHaveBeenCalledTimes(1);
      expect(redis.del).toHaveBeenCalledWith('taxonomy:a', 'taxonomy:b');
    });

    it('fails soft when scanning throws', async () => {
      const redis = buildRedisMock();
      redis.scanStream.mockImplementation(() => {
        throw new Error('scan failed');
      });

      const service = buildService(redis);
      await expect(service.deleteByPrefix('taxonomy:')).resolves.toBeUndefined();
    });
  });
});
