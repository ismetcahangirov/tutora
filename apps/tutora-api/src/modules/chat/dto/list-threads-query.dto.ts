import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Query for `GET /api/v1/chat/threads`. Pagination only for now. */
export class ListThreadsQueryDto extends PaginationQueryDto {}
