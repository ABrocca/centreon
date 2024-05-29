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

namespace Core\TimePeriod\Infrastructure\API\FindTimePeriod;

use Centreon\Domain\Log\LoggerTrait;
use Core\Application\Common\UseCase\ResponseInterface;
use Symfony\Component\Serializer\Exception\ExceptionInterface;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\SerializerInterface;

class FindTimePeriodPresenter
{
    use LoggerTrait;
    public const FORMAT_JSON = 'json';
    public const FORMAT_XML = 'xml';

    /**
     * @param Serializer $serializer
     */
    public function __construct(readonly private SerializerInterface $serializer)
    {
    }

    /**
     * @param ResponseInterface $data
     * @param string $format
     * @param array<mixed> $context
     *
     * @throws ExceptionInterface
     *
     * @return string
     */
    public function present(mixed $data, string $format = self::FORMAT_JSON, array $context = []): string
    {
        return $this->serializer->serialize($data, $format, $context);
    }
}
