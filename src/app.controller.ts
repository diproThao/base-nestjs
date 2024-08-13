import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Router } from 'express';

@ApiTags('ping')
@Controller('ping')
export class AppController {
  @Get('/')
  getAddress(@Query() q) {
    return `pong ${JSON.stringify(q)}`;
  }

  @Get('/test')
  root(@Request() req: ExpressRequest) {
    const group = {};
    const router = req.app._router as Router;

    const data = {
      routes: router.stack
        .map((layer) => {
          if (layer.route) {
            const path = layer.route?.path;
            const regexp = layer.regexp;
            const method = layer.route?.stack[0].method?.toUpperCase();

            const groupPath = layer.route?.path
              .split('/')
              .slice(0, 5)
              .join('/');
            if (!path?.includes('swagger')) {
              group[groupPath] = [
                ...(group[groupPath] || []),
                { path, method, regexp: regexp.source },
              ];
            }

            return `${method.toUpperCase()} ${path}`;
          }
        })
        .filter((item) => item !== undefined),
    };

    for (const [commonPath, controllers] of Object.entries(group)) {
      group[commonPath] = {
        common: {},
        router: controllers,
      };
      for (const controller of controllers as {
        path: string;
        method: string;
        regexp: string;
      }[]) {
        if (
          controller.method === 'GET' &&
          controller.path === commonPath &&
          controller.regexp.endsWith('\\/?$')
        ) {
          group[commonPath].common = {
            regex: controller.regexp.replace(
              '\\/?$',
              '(\\/(?:([^\\/]+?)))?\\/?$',
            ),
            method: ['GET', 'PATCH', 'DELETE'],
          };
        }
      }
    }
    return { group, data };
  }
}
