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

namespace Core\TimePeriod\Application\UseCase\AddTimePeriod;

use Symfony\Component\Validator\Constraints as Assert;

final class AddTimePeriodRequest
{
    /**
     * @param string $name
     * @param string $alias
     * @param array<array{day: int, time_range:string}> $days
     * @param int[] $templates
     * @param array<array{day_range: string, time_range:string}> $exceptions
     */
    public function __construct(
        #[Assert\NotBlank]
        public readonly string $name,
        #[Assert\NotBlank]
        public readonly string $alias,
        #[Assert\Collection(
            fields: [
                'day' => new Assert\Required([
                    new Assert\NotBlank,
                    new Assert\Type('integer'),
                ]),
                'time_range' => new Assert\Required([
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                ]),
            ]
        )]
        public readonly array $days,
        public readonly array $templates = [],
        #[Assert\Collection(
            fields: [
                'day_range' => new Assert\Required([
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                ]),
                'time_range' => new Assert\Required([
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                ]),
            ]
        )]
        public readonly array $exceptions = [],
    ) {
    }
}
