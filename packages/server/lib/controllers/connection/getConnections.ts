import { z } from 'zod';

import { connectionService } from '@nangohq/shared';
import { zodErrorToHTTP } from '@nangohq/utils';

import { connectionSimpleToPublicApi } from '../../formatters/connection.js';
import { asyncWrapper } from '../../utils/asyncWrapper.js';

import type { GetPublicConnections } from '@nangohq/types';

const validationQuery = z
    .object({
        connectionId: z.string().min(1).max(255).optional(),
        search: z.string().min(1).max(255).optional(),
        endUserId: z.string().min(1).max(255).optional(),
        endUserOrganizationId: z.string().min(1).max(255).optional(),
        metadata: z.string().min(1).max(255).optional()
    })
    .strict();

export const getPublicConnections = asyncWrapper<GetPublicConnections>(async (req, res) => {
    const queryParamValues = validationQuery.safeParse(req.query);
    if (!queryParamValues.success) {
        res.status(400).send({
            error: { code: 'invalid_query_params', errors: zodErrorToHTTP(queryParamValues.error) }
        });
        return;
    }

    const { environment } = res.locals;
    const queryParam: GetPublicConnections['Querystring'] = queryParamValues.data;

    // try to convert metadata to a record if it's a valid JSON string else {}
    let metadata_obj: Record<string, string> | null = null;
    if (queryParam.metadata) {
        try {
            metadata_obj = JSON.parse(queryParam.metadata);
        } catch {
            res.status(400).send({
                error: { code: 'invalid_query_params', message: 'Metadata must be a valid JSON string' }
            });
            metadata_obj = {};
        }
    }

    const connections = await connectionService.listConnections({
        environmentId: environment.id,
        connectionId: queryParam.connectionId,
        search: queryParam.search,
        endUserId: queryParam.endUserId,
        endUserOrganizationId: queryParam.endUserOrganizationId,
        metadata: metadata_obj ?? {},
        limit: 10000
    });

    res.status(200).send({
        connections: connections.map((data) => {
            // TODO: return end_user
            return connectionSimpleToPublicApi({
                data: data.connection,
                activeLog: data.active_logs,
                provider: data.provider,
                endUser: data.end_user
            });
        })
    });
});
