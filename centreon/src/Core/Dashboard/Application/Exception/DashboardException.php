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

namespace Core\Dashboard\Application\Exception;

class DashboardException extends \Exception
{
    /**
     * @return self
     */
    public static function errorWhileSearching(): self
    {
        return new self(_('Error while searching for dashboards'));
    }

    /**
     * @return self
     */
    public static function accessNotAllowed(): self
    {
        return new self(_('You are not allowed to access dashboards'));
    }

    /**
     * @return self
     */
    public static function accessNotAllowedForWriting(): self
    {
        return new self(_('You are not allowed to perform write operations on dashboards'));
    }

    /**
     * @return self
     */
    public static function errorWhileAdding(): self
    {
        return new self(_('Error while adding a dashboard'));
    }

    /**
     * @return self
     */
    public static function errorWhileRetrievingJustCreated(): self
    {
        return new self(_('Error while retrieving newly created dashboard'));
    }

    /**
     * @return self
     */
    public static function errorWhileRetrieving(): self
    {
        return new self(_('Error while retrieving a dashboard'));
    }
}
