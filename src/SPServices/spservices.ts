import { WebPartContext } from "@microsoft/sp-webpart-base";


import { SearchResults, ISearchQuery, SortDirection } from '@pnp/sp/search';
import { ISPServices } from "./ISPServices";
import{ SPHttpClient, SPHttpClientResponse,ISPHttpClientOptions, } from '@microsoft/sp-http'


import {  sp } from "@pnp/sp/presets/all";

export interface IColumnConfig {
  internalName: string;
  displayName: string;
}

export class spservices implements ISPServices {

  static Top: any = 20;
  static Sello: any = null;
  static HojaReporte: any = null;
  static Logo: any = null;
  static itemsAeropuertos: any = null;
  static SPContext: any = null;
  constructor(private context: WebPartContext) {
    
    sp.setup({
      spfxContext: {
        pageContext: {
          web: {
            absoluteUrl: this.context.pageContext.web.absoluteUrl
          }
        }
      }
    });

    spservices.SPContext = this.context
  }

  public async obtenerDocumentos(
    startRow: number,
    rowsPerPage: number,
    columnas: IColumnConfig[],
    bibliotecaRelativa: string, // Ahora recibe la ruta RELATIVA de la biblioteca
    ordenColumna: string,
    direccionOrden: string,
    filtro:string
): Promise<any[]> {
 
    const columnasSeleccionadas = columnas.map(col => col.internalName).join(',');
    let skipToken = "";

    if (startRow > 0) {
        skipToken = `&$skiptoken=Paged=TRUE&p_ID=${startRow}`;
    }

    let filter = "";

    const baseUrl = this.context.pageContext.web.absoluteUrl; // Obtiene la URL base del sitio
    let url = `${baseUrl}/_api/web/lists/getbytitle('`+bibliotecaRelativa+`')/Items?$top=${rowsPerPage}&$expand=File&$orderby=${ordenColumna} ${direccionOrden}&$select=File,${columnasSeleccionadas}&${skipToken}`;

    if (filtro) { // Aplicar filtro solo si se proporciona un término de búsqueda
      const encodedSearchTerm = encodeURIComponent(filtro); // Codificar el término de búsqueda
      filter = `&$filter=startswith(FileLeafRef,'${encodedSearchTerm}') or substringof('${encodedSearchTerm}',FileLeafRef)`;
      url+= (url + filter);
    }
    
    try {
        const response: SPHttpClientResponse = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
        const data = await response.json();

        if (data.value && data.value.length > 0) {
            return data.value;
        } else {
            return [];
        }

    } catch (error) {
        console.error("Error al obtener documentos:", error);
        return [];
    }
}

 public async buscarDocumentos(queryText: string, startRow: number, rowsPerPage: number, columnas: IColumnConfig[], biblioteca: string) {
   
 
  const resultados = await sp.search({
        Querytext: `${queryText} Path:"${biblioteca}"`,
        RowLimit: rowsPerPage,
        StartRow: startRow,
        SelectProperties: columnas.map(col => col.internalName),
        SortList: [
            { Property: "Created", Direction: 1 }
        ]
    });

    return resultados.PrimarySearchResults;
}
  
}
