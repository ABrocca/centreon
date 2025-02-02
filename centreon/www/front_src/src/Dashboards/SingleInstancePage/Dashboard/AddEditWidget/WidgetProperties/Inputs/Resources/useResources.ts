import { ChangeEvent, useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import {
  T,
  always,
  cond,
  equals,
  isEmpty,
  propEq,
  reject,
  pluck,
  includes,
  isNotNil,
  find,
  last,
  filter,
  pick,
  map
} from 'ramda';
import { useAtomValue } from 'jotai';

import {
  QueryParameter,
  SelectEntry,
  buildListingEndpoint
} from '@centreon/ui';
import { additionalResourcesAtom } from '@centreon/ui-context';

import {
  Widget,
  WidgetDataResource,
  WidgetPropertyProps,
  WidgetResourceType
} from '../../../models';
import {
  labelHost,
  labelHostCategory,
  labelHostGroup,
  labelMetaService,
  labelPleaseSelectAResource,
  labelService,
  labelServiceCategory,
  labelServiceGroup
} from '../../../../translatedLabels';
import { baseEndpoint } from '../../../../../../../api/endpoint';
import { getDataProperty } from '../utils';
import {
  hasMetricInputTypeDerivedAtom,
  widgetPropertiesMetaPropertiesDerivedAtom
} from '../../../atoms';

interface UseResourcesState {
  addButtonHidden?: boolean;
  addResource: () => void;
  changeIdValue: (resourceType) => (({ name }) => string) | undefined;
  changeResource: (index: number) => (_, resources: SelectEntry) => void;
  changeResourceType: (
    index: number
  ) => (e: ChangeEvent<HTMLInputElement>) => void;
  changeResources: (
    index: number
  ) => (_, resources: Array<SelectEntry>) => void;
  deleteResource: (index: number) => () => void;
  deleteResourceItem: ({ index, option, resources }) => void;
  error: string | null;
  getResourceResourceBaseEndpoint: ({
    index,
    resourceType
  }: {
    index: number;
    resourceType: string;
  }) => (parameters) => string;
  getResourceStatic: (resourceType: WidgetResourceType) => boolean | undefined;
  getResourceTypeOptions: (index, resource) => Array<ResourceTypeOption>;
  getSearchField: (resourceType: WidgetResourceType) => string;
  isLastResourceInTree: boolean;
  singleResourceSelection?: boolean;
  value: Array<WidgetDataResource>;
}

interface ResourceTypeOption {
  id: WidgetResourceType;
  name: string;
}

export const resourceTypeBaseEndpoints = {
  [WidgetResourceType.host]: '/resources',
  [WidgetResourceType.hostCategory]: '/hosts/categories',
  [WidgetResourceType.hostGroup]: '/hostgroups',
  [WidgetResourceType.service]: '/services/names',
  [WidgetResourceType.serviceCategory]: '/services/categories',
  [WidgetResourceType.serviceGroup]: '/servicegroups',
  [WidgetResourceType.metaService]: '/resources'
};

interface ResourceTypeOption {
  availableResourceTypeOptions: Array<{ id: WidgetResourceType; name: string }>;
  id: WidgetResourceType;
  name: string;
}

export const resourceTypeOptions: Array<ResourceTypeOption> = [
  {
    availableResourceTypeOptions: [
      { id: WidgetResourceType.serviceGroup, name: labelServiceGroup },
      { id: WidgetResourceType.serviceCategory, name: labelServiceCategory },
      { id: WidgetResourceType.service, name: labelService }
    ],
    id: WidgetResourceType.host,
    name: labelHost
  },
  {
    availableResourceTypeOptions: [
      { id: WidgetResourceType.hostGroup, name: labelHostGroup },
      { id: WidgetResourceType.host, name: labelHost },
      { id: WidgetResourceType.serviceGroup, name: labelServiceGroup },
      { id: WidgetResourceType.serviceCategory, name: labelServiceCategory },
      { id: WidgetResourceType.service, name: labelService }
    ],
    id: WidgetResourceType.hostCategory,
    name: labelHostCategory
  },
  {
    availableResourceTypeOptions: [
      { id: WidgetResourceType.hostCategory, name: labelHostCategory },
      { id: WidgetResourceType.host, name: labelHost },
      { id: WidgetResourceType.serviceGroup, name: labelServiceGroup },
      { id: WidgetResourceType.serviceCategory, name: labelServiceCategory },
      { id: WidgetResourceType.service, name: labelService }
    ],
    id: WidgetResourceType.hostGroup,
    name: labelHostGroup
  },
  {
    availableResourceTypeOptions: [],
    id: WidgetResourceType.service,
    name: labelService
  },
  {
    availableResourceTypeOptions: [
      { id: WidgetResourceType.serviceGroup, name: labelServiceGroup },
      { id: WidgetResourceType.service, name: labelService }
    ],
    id: WidgetResourceType.serviceCategory,
    name: labelServiceCategory
  },
  {
    availableResourceTypeOptions: [
      { id: WidgetResourceType.serviceCategory, name: labelServiceCategory },
      { id: WidgetResourceType.service, name: labelService }
    ],
    id: WidgetResourceType.serviceGroup,
    name: labelServiceGroup
  },
  {
    availableResourceTypeOptions: [],
    id: WidgetResourceType.metaService,
    name: labelMetaService
  }
];

const getAdditionalQueryParameters = (
  resourceType: WidgetResourceType,
  onlyWithPerformanceData = false
): Array<{ name: string; value: unknown }> => [
  {
    name: 'types',
    value: [resourceType.replace(/-/g, '')]
  },
  {
    name: 'only_with_performance_data',
    value: equals(resourceType, WidgetResourceType.host)
      ? false
      : onlyWithPerformanceData
  },
  {
    name: 'limit',
    value: 30
  }
];

const useResources = ({
  propertyName,
  restrictedResourceTypes,
  required,
  useAdditionalResources,
  excludedResourceTypes
}: Pick<
  WidgetPropertyProps,
  | 'propertyName'
  | 'restrictedResourceTypes'
  | 'excludedResourceTypes'
  | 'required'
  | 'useAdditionalResources'
>): UseResourcesState => {
  const { values, setFieldValue, setFieldTouched, touched } =
    useFormikContext<Widget>();

  const value = useMemo<Array<WidgetDataResource> | undefined>(
    () => getDataProperty({ obj: values, propertyName }),
    [getDataProperty({ obj: values, propertyName })]
  );

  const isTouched = useMemo<boolean | undefined>(
    () => getDataProperty({ obj: touched, propertyName }),
    [getDataProperty({ obj: touched, propertyName })]
  );

  const widgetProperties = useAtomValue(
    widgetPropertiesMetaPropertiesDerivedAtom
  );
  const hasMetricInputType = useAtomValue(hasMetricInputTypeDerivedAtom);
  const additionalResources = useAtomValue(additionalResourcesAtom);

  const errorToDisplay =
    isTouched && required && isEmpty(value) ? labelPleaseSelectAResource : null;

  const getResourceStatic = (
    resourceType: WidgetResourceType
  ): boolean | undefined => {
    return (
      widgetProperties?.singleMetricSelection &&
      widgetProperties?.singleResourceSelection &&
      (equals(resourceType, WidgetResourceType.host) ||
        equals(resourceType, WidgetResourceType.service))
    );
  };

  const changeResourceType =
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const isNotLastResourceTypeChanged = value?.length || 0 - 1 > index;

      if (isNotLastResourceTypeChanged) {
        const newValue = value?.slice(0, index + 1);
        setFieldValue(`data.${propertyName}`, newValue);
      }

      setFieldValue(
        `data.${propertyName}.${index}.resourceType`,
        e.target.value
      );
      setFieldValue(`data.${propertyName}.${index}.resources`, [], false);
    };

  const changeResources =
    (index: number) => (_, resources: Array<SelectEntry>) => {
      const selectedResources = map(pick(['id', 'name']), resources || []);

      setFieldValue(
        `data.${propertyName}.${index}.resources`,
        selectedResources
      );
      setFieldTouched(`data.${propertyName}`, true, false);
    };

  const changeResource = (index: number) => (_, resource: SelectEntry) => {
    const selectedResource = resource ? pick(['id', 'name'], resource) : {};

    setFieldValue(`data.${propertyName}.${index}.resources`, [
      selectedResource
    ]);
    setFieldTouched(`data.${propertyName}`, true, false);
  };

  const addResource = (): void => {
    setFieldValue(`data.${propertyName}`, [
      ...(value || []),
      {
        resourceType: '',
        resources: []
      }
    ]);
  };

  const deleteResource = (index: number | string) => (): void => {
    setFieldValue(
      `data.${propertyName}`,
      (value || []).filter((_, i) => !equals(i, index))
    );
    setFieldTouched(`data.${propertyName}`, true, false);
  };

  const deleteResourceItem = ({ index, option, resources }): void => {
    const newResource = reject(propEq(option.id, 'id'), resources);

    setFieldValue(`data.${propertyName}.${index}.resources`, newResource);
    setFieldTouched(`data.${propertyName}`, true, false);
  };

  const getCustomQueryParameters = (
    index: number,
    resourceType
  ): Array<QueryParameter> => {
    const usesResourcesEndpoint = includes(resourceType, [
      WidgetResourceType.host,
      WidgetResourceType.metaService
    ]);
    const isOfTypeService = equals(resourceType, WidgetResourceType.service);
    const isOfTypeCategory = includes(resourceType, [
      WidgetResourceType.hostCategory,
      WidgetResourceType.serviceCategory
    ]);

    if (equals(index, 0)) {
      return usesResourcesEndpoint
        ? getAdditionalQueryParameters(resourceType, hasMetricInputType)
        : [];
    }
    const searchParameter = value?.[index - 1].resourceType as string;
    const searchValues = pluck('name', value?.[index - 1].resources);

    if (!usesResourcesEndpoint && !isOfTypeCategory) {
      const serviceParameters = isOfTypeService
        ? [
            {
              name: 'only_with_performance_data',
              value: hasMetricInputType
            }
          ]
        : [];

      return [
        {
          name: 'search',
          value: {
            [`${searchParameter.replace('-', '_')}.name`]: {
              $in: searchValues
            }
          }
        },
        ...serviceParameters
      ];
    }

    const baseParams = getAdditionalQueryParameters(
      resourceType,
      hasMetricInputType
    );

    return [
      ...baseParams,
      {
        name: includes('category', searchParameter)
          ? `${searchParameter.replace('-', '_')}_names`
          : `${searchParameter.replace('-', '')}_names`,
        value: searchValues
      }
    ];
  };

  const getResourceResourceBaseEndpoint =
    ({ index, resourceType }) =>
    (parameters): string => {
      const additionalResource = find(
        ({ resourceType: additionalResourceType }) =>
          equals(resourceType, additionalResourceType),
        additionalResources
      );

      const endpoint = !additionalResource
        ? `${baseEndpoint}/monitoring${resourceTypeBaseEndpoints[resourceType]}`
        : additionalResource?.baseEndpoint;

      const search = !additionalResource?.defaultMonitoringParameter
        ? parameters.search
        : {
            ...parameters.search,
            lists: [
              ...(parameters.search?.lists || []),
              ...Object.entries(
                additionalResource.defaultMonitoringParameter || {}
              ).map(([propertyKey, propertyValue]) => ({
                field: propertyKey,
                values: [propertyValue]
              }))
            ]
          };

      return buildListingEndpoint({
        baseEndpoint: endpoint,
        customQueryParameters: getCustomQueryParameters(index, resourceType),
        parameters: {
          ...parameters,
          limit: 30,
          search
        }
      });
    };

  const getSearchField = (resourceType: string): string =>
    cond([
      [equals('host'), always('host.name')],
      [T, always('name')]
    ])(resourceType);

  const hasRestrictedTypes = useMemo(
    () =>
      isNotNil(restrictedResourceTypes) && !isEmpty(restrictedResourceTypes),
    [restrictedResourceTypes]
  );

  const resourcetypesIds = pluck('resourceType', value || []);

  const getResourceTypeOptions = useCallback(
    (index, resource): Array<ResourceTypeOption> => {
      const additionalResourceTypeOptions = useAdditionalResources
        ? additionalResources.map(({ resourceType, label }) => ({
            id: resourceType,
            name: label
          }))
        : [];

      const availableResourceTypes = [
        ...(index < 1
          ? resourceTypeOptions
          : resourceTypeOptions.find(
              ({ id }) => id === value?.[index - 1].resourceType
            )?.availableResourceTypeOptions || []),
        ...additionalResourceTypeOptions
      ];

      const filteredResourceTypeOptions = filter(({ id }) => {
        if (hasRestrictedTypes) {
          return includes(id, restrictedResourceTypes || []);
        }

        return (
          (!includes(id, excludedResourceTypes || []) &&
            includes(id, pluck('id', availableResourceTypes)) &&
            !includes(id, resourcetypesIds)) ||
          equals(id, resource.resourceType)
        );
      }, availableResourceTypes);

      return filteredResourceTypeOptions;
    },
    [
      additionalResources,
      useAdditionalResources,
      hasRestrictedTypes,
      excludedResourceTypes,
      value
    ]
  );

  useEffect(() => {
    if (!isEmpty(value)) {
      return;
    }

    if (
      widgetProperties?.singleMetricSelection &&
      widgetProperties?.singleResourceSelection
    ) {
      setFieldValue(`data.${propertyName}`, [
        {
          resourceType: WidgetResourceType.host,
          resources: []
        },
        {
          resourceType: WidgetResourceType.service,
          resources: []
        }
      ]);

      return;
    }

    setFieldValue(`data.${propertyName}`, [
      {
        resourceType: '',
        resources: []
      }
    ]);
  }, [values.moduleName]);

  const isLastResourceInTree = isEmpty(
    resourceTypeOptions.find(({ id }) => equals(id, last(resourcetypesIds)))
      ?.availableResourceTypeOptions
  );

  const changeIdValue = (resourceType): (({ name }) => string) | undefined => {
    const isOfTypeService = equals(resourceType, WidgetResourceType.service);

    if (!isOfTypeService) {
      return undefined;
    }

    return ({ name }) => name;
  };

  return {
    addResource,
    changeIdValue,
    changeResource,
    changeResourceType,
    changeResources,
    deleteResource,
    deleteResourceItem,
    error: errorToDisplay,
    getResourceResourceBaseEndpoint,
    getResourceStatic,
    getResourceTypeOptions,
    getSearchField,
    isLastResourceInTree,
    singleResourceSelection: widgetProperties?.singleResourceSelection,
    value: value || []
  };
};

export default useResources;
