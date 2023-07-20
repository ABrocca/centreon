import { PanelConfiguration } from '../models';

export interface Widget {
  id: string | null;
  options: object;
  panelConfiguration: PanelConfiguration | null;
}

export interface WidgetPropertyProps {
  label: string;
  propertyName: string;
}
