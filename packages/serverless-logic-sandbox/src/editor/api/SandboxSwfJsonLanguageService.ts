/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SwfJsonLanguageService } from "@kie-tools/serverless-workflow-language-service/dist/channel";
import { SwfServiceCatalogStore } from "./SwfServiceCatalogStore";

export class SandboxSwfJsonLanguageService extends SwfJsonLanguageService {
  constructor(private readonly catalogStore: SwfServiceCatalogStore) {
    super({
      fs: {},
      serviceCatalog: {
        global: {
          getServices: async () => this.catalogStore.services,
        },
        relative: {
          getServices: async (_textDocument) => [],
        },
        getServiceFileNameFromSwfServiceCatalogServiceId: async (
          registryName: string,
          swfServiceCatalogServiceId: string
        ) => `${registryName}__${swfServiceCatalogServiceId}__latest.yaml`,
      },
      config: {
        shouldDisplayServiceRegistriesIntegration: async () => false,
        shouldReferenceServiceRegistryFunctionsWithUrls: async () => true,
        getSpecsDirPosixPaths: async (_textDocument) => ({
          specsDirRelativePosixPath: "",
          specsDirAbsolutePosixPath: "",
        }),
        shouldConfigureServiceRegistries: () => false,
        shouldServiceRegistriesLogIn: () => false,
        canRefreshServices: () => true,
      },
    });
  }
}
