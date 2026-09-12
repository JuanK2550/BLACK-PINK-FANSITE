// Módulo de búsqueda por contexto (RAG).

import { Module } from '@nestjs/common';
import { ContentSourceService } from './content-source.service';
import { IndexerService } from './indexer.service';
import { ReindexController } from './reindex.controller';
import { RetrievalService } from './retrieval.service';
import { VectorStoreService } from './vector-store.service';

@Module({
  controllers: [ReindexController],
  providers: [ContentSourceService, VectorStoreService, IndexerService, RetrievalService],
  exports: [RetrievalService, IndexerService, VectorStoreService],
})
export class RagModule {}
