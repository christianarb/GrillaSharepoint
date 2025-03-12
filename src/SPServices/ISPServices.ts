import {  SearchResults } from '@pnp/sp/search';

export interface IColumnConfig {
    internalName: string;
    displayName: string;
  }
  

export interface ISPServices {

 
   obtenerDocumentos(startRow: number, rowsPerPage: number,
       columnas: IColumnConfig[], biblioteca: string, ordenColumna: any,filtro:string,camposAfiltrar:any): Promise<any[]>;
    buscarDocumentos(queryText: string, startRow: number, rowsPerPage: number, columnas: IColumnConfig[], biblioteca: string)
    

}
