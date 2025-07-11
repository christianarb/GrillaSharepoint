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

  public async ObetenerColumnas(bibliotecaRelativa:string): Promise<any[]> {

    try {
    
    // debugger;
      const baseUrl = this.context.pageContext.web.absoluteUrl; // URL base del sitio
      let  url = `${baseUrl}/_api/web/lists/getbytitle('${bibliotecaRelativa}')/fields?$select=Title,InternalName`
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
  
  public async obtenerDocumentos(
    startRow: number,
    rowsPerPage: number,
    columnas: IColumnConfig[],
    bibliotecaRelativa: string, // Ahora recibe la ruta RELATIVA de la biblioteca
    ordenColumna: any[],
    filtro:string,
    camposAfiltrar:any,
    columnaAgrupacion:any
): Promise<any[]> {



  
  // debugger;
 

    const colimnasOrdenadas = ordenColumna.map(campo =>       `${campo.internalName} ${campo.orden}`  ).join(", ");


    const setColumnas = new Set(columnas.map(col => col.internalName));
    const nuevasColumnas = [...columnas, ...ordenColumna.filter(col => !setColumnas.has(col.internalName))];
    const columnasSeleccionadas = nuevasColumnas.map(col => col.internalName); //.join(',');


    const setColumnas1 = new Set(columnasSeleccionadas.map(col => col));
    const nuevasColumnas1 = [...columnasSeleccionadas, ...columnaAgrupacion.filter(col => !setColumnas1.has(col))];
    const columnasSeleccionadas1 = nuevasColumnas1.map(col => col).join(',');








    let skipToken = "";


    let filter = "";

    if (startRow > 0) {
    skipToken = `&$skiptoken=Paged=TRUE&p_ID=${startRow}`;
      }

        

      console.log("Columnas: " + columnasSeleccionadas)

      const baseUrl = this.context.pageContext.web.absoluteUrl; // URL base del sitio
      let url = `${baseUrl}/_api/web/lists/getbytitle('${bibliotecaRelativa}')/Items?$top=${rowsPerPage}&$expand=File&$orderby=${colimnasOrdenadas}&$select=sgdNombreDocumento,File/ServerRelativeUrl,${columnasSeleccionadas1}&${skipToken}`;

      if (filtro) { 
          // Codifica el término de búsqueda para evitar errores en la consulta OData
          const encodedSearchTerm = filtro; //encodeURIComponent(filtro);
          
          // Generar filtros dinámicos basados en los campos especificados
          const filtrosDinamicos = camposAfiltrar.map(campo => 
              `startswith(${campo},'${encodedSearchTerm}') or substringof('${encodedSearchTerm}',${campo})`
          ).join(" or ");

          // Construcción del filtro OData
          filter = `&$filter=${filtrosDinamicos}`;
          
          url += filter;
      }

    
    try {
        console.log(url);
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
