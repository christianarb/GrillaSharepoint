import * as React from 'react';
import styles from './Grilla.module.scss';
import type { IgrillaTreeviewProps } from './IgrillaTreeviewProps';
import { escape } from '@microsoft/sp-lodash-subset';
import {GrillaComponente} from './GrillaComponent'

export default class grillaTreeview extends React.Component<IgrillaTreeviewProps, {}> {
  public render(): React.ReactElement<IgrillaTreeviewProps> {
    const {
      SpContext,
      columnas,
      columnaAgrupacion,
      biblioteca,
      camposAfiltrar,
      ordenamiento
    } = this.props;

    return (       
      <GrillaComponente  SpContext={SpContext} 
      columnas={columnas} 
      columnasAgrupacion={columnaAgrupacion} 
      camposAfiltrar={camposAfiltrar}
      ordenamiento={ordenamiento}
      biblioteca={biblioteca}></GrillaComponente>     
 
  );

   /* return (       
        <GrillaComponente SpContext={SpContext} 
        columnas={columnas} 
        columnasAgrupacion={columnaAgrupacion} 
        biblioteca={biblioteca}>          
        </GrillaComponente>  
    );*/
  }
}
