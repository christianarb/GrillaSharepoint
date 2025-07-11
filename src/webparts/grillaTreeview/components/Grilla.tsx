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
      ordenamiento,
      cantidadRegistros
    } = this.props;

    return (       
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <div style={{  width: '1200px' }}>
        <GrillaComponente  SpContext={SpContext} 
        columnas={columnas} 
        columnasAgrupacion={columnaAgrupacion} 
        camposAfiltrar={camposAfiltrar}
        ordenamiento={ordenamiento}
        cantidadRegistros={cantidadRegistros}
        biblioteca={biblioteca}></GrillaComponente>    
      </div> 
      </div>
 
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
