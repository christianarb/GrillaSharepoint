import {  SearchResults } from '@pnp/sp/search';

export interface IColumnConfig {
    internalName: string;
    displayName: string;
  }
  

export interface ISPServices {

 
   obtenerDocumentos(startRow: number, rowsPerPage: number,
       columnas: IColumnConfig[], biblioteca: string, ordenColumna: any,filtro:string,camposAfiltrar:any,
       columnaAgrupacion:any): Promise<any[]>;


    ObetenerColumnas(bibliotecaRelativa:string): Promise<any[]>;

    buscarDocumentos(queryText: string, startRow: number, rowsPerPage: number, columnas: IColumnConfig[], biblioteca: string)
    

}
