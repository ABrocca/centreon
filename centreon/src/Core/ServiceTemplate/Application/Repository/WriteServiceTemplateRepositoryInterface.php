<?php

/*
 * Copyright 2005 - 2023 Centreon (https://www.centreon.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * For more information : contact@centreon.com
 *
 */

declare(strict_types=1);

namespace Core\ServiceTemplate\Application\Repository;

use Core\ServiceTemplate\Domain\Model\NewServiceTemplate;
use Core\ServiceTemplate\Domain\Model\ServiceTemplate;

interface WriteServiceTemplateRepositoryInterface
{
    /**
     * Delete a service template by ID.
     *
     * @param int $serviceTemplateId
     *
     * @throws \Throwable
     */
    public function deleteById(int $serviceTemplateId): void;

    /**
     * Add a new service template.
     *
     * @param NewServiceTemplate $newServiceTemplate
     *
     * @throws \Throwable
     *
     * @return int
     */
    public function add(NewServiceTemplate $newServiceTemplate): int;

    /**
     * Link the service template to host templates.
     *
     * @param int $serviceTemplateId
     * @param list<int> $hostTemplateIds
     *
     * @throws \Throwable
     */
    public function linkToHosts(int $serviceTemplateId, array $hostTemplateIds): void;

    /**
     * Unlink all host templates from the service template.
     *
     * @param int $serviceTemplateId
     *
     * @throws \Throwable
     */
    public function unlinkHosts(int $serviceTemplateId): void;

    /**
     * Update a service template.
     *
     * @param ServiceTemplate $serviceTemplate
     *
     * @throws \Throwable
     */
    public function update(ServiceTemplate $serviceTemplate): void;
}
