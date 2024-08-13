import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { QueryErrorFilter } from './common/QueryErrorFilter';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders:
      'authorization, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS,PATCH',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      skipNullProperties: true,
      skipMissingProperties: true,
    }),
  );

  const configService = app.get(ConfigService);

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalFilters(new QueryErrorFilter(httpAdapter));

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const port = configService.get<number>('port');

  let swaggerUrl = '';

  if (
    ['development', 'staging'].includes(configService.get<string>('appEnv'))
  ) {
    setupSwagger(app);
    swaggerUrl = `http://0.0.0.0:${port}/swagger`;
  }

  await app.listen(port, '0.0.0.0');

  console.table({
    syncDB: configService.get<boolean>('database.synDB'),
    environment: configService.get<string>('appEnv'),
    swaggerUrl,
  });
  console.info(`server running on http://0.0.0.0:${port}`);
  console.log(new Date().toString());
}
bootstrap();
