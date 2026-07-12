import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';

/** Query for `GET /api/v1/chat/threads/:id/messages`. Pagination only for now. */
export class ListMessagesQueryDto extends PaginationQueryDto {}
