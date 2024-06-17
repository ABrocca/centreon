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

namespace Core\Infrastructure\Common\Api;

use Centreon\Domain\Log\LoggerTrait;
use Core\Application\Common\UseCase\ResponseStatusInterface;
use Core\Application\Common\UseCase\StandardPresenterInterface;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Exception\ExceptionInterface;
use Symfony\Component\Serializer\Mapping\Factory\ClassMetadataFactory;
use Symfony\Component\Serializer\Mapping\Loader\YamlFileLoader;
use Symfony\Component\Serializer\NameConverter\CamelCaseToSnakeCaseNameConverter;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\SerializerInterface;

class StandardPresenter implements StandardPresenterInterface
{
    use LoggerTrait;

    /**
     * @param Serializer $serializer
     */
    public function __construct(readonly private SerializerInterface $serializer)
    {
    }

    /**
     * @param object $data
     * @param string $normalizeDefinition
     * @param string $format
     * @param array<mixed> $context
     *
     * @throws ExceptionInterface
     * @return string
     */
    public function present(
        mixed $data,
        string $normalizeDefinition,
        string $format = JsonEncoder::FORMAT,
        array $context = []
    ): string {
        if (! $data instanceof ResponseStatusInterface) {
            if (! file_exists($normalizeDefinition)) {
                throw new \InvalidArgumentException('The normalizer file (' . $normalizeDefinition . ') does not exist.');
            }
            $classMetadataFactory = new ClassMetadataFactory(new YamlFileLoader($normalizeDefinition));
            $normalizer = new ObjectNormalizer(
                $classMetadataFactory,
                new CamelCaseToSnakeCaseNameConverter()
            );
            $serializer = new Serializer([$normalizer], [new JsonEncoder()]);
            $normalization = $serializer->normalize($data, null, ['groups' => 'Default']);
            return $serializer->serialize($normalization, $format, $context);
        }
        return $this->serializer->serialize($data, $format, $context);
    }
}
