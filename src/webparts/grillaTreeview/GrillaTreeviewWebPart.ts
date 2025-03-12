import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
    IPropertyPaneConfiguration,
    PropertyPaneTextField,
    PropertyPaneLabel, // Importa PropertyPaneLabel
    PropertyPaneButton // Importa PropertyPaneButton
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'grillaTreeviewWebPartStrings';
import grillaTreeview from './components/Grilla';
import { IgrillaTreeviewProps } from './components/IgrillaTreeviewProps';
import { SPComponentLoader } from '@microsoft/sp-loader';

interface IColumnConfig {
    internalName: string;
    displayName: string;
}

export interface IgrillaTreeviewWebPartProps {
    columnas: string;
    columnasAgrupacion: string; // Nuevo prop para las columnas de agrupación
    biblioteca: string;
    camposAfiltrar:string;
    ordenamiento:string;
}

export default class grillaTreeviewWebPart extends BaseClientSideWebPart<IgrillaTreeviewWebPartProps> {

    public render(): void {
        const siteColUrl = this.context.pageContext.web.absoluteUrl;

        try {
            SPComponentLoader.loadScript(siteColUrl + '/_layouts/15/init.js', {
                globalExportsName: '$_global_init'
            })
              .then(() => SPComponentLoader.loadScript(siteColUrl + '/_layouts/15/MicrosoftAjax.js', { globalExportsName: 'Sys' }))
              .then(() => SPComponentLoader.loadScript(siteColUrl + '/_layouts/15/SP.Runtime.js', { globalExportsName: 'SP' }))
              .then(() => SPComponentLoader.loadScript(siteColUrl + '/_layouts/15/SP.js', { globalExportsName: 'SP' }))
              .then(() => {
               
                    debugger;
                    const columnasConfig: IColumnConfig = this._obtenerColumnas(this.properties.columnas);
                    const columnasAgrupacionConfig: any = this._obtenerColumnasAgrupacion(); // Obtener columnas de agrupación
                    const camposAfiltrar: any = this._obtenerColumnasFiltro();
                    const ordenamiento: any = this._obtenerOrdenamiento();

                    const element: React.ReactElement<IgrillaTreeviewProps> = React.createElement(
                        grillaTreeview,
                        {
                            SpContext: this.context,
                            columnas: columnasConfig,
                            columnaAgrupacion: columnasAgrupacionConfig, // Pasar las columnas de agrupación
                            biblioteca: this.properties.biblioteca,
                            camposAfiltrar: camposAfiltrar,
                            ordenamiento: ordenamiento
                            
                        }
                    );

                    ReactDom.render(element, this.domElement);
                })
              .catch((reason: any) => {
                    console.error('Error cargando scripts de SharePoint:', reason);
                });
        } catch (error) {
            console.error('Error en el bloque try:', error);
        }
    }


    private _obtenerColumnas(columnasProp: string): IColumnConfig {
        try {
            return JSON.parse(columnasProp || '');
        } catch (error) {
            console.error('Error parseando las columnas:', error);
            return;
        }
    }

    private _obtenerColumnasAgrupacion(): any {
       
        try {
           
            var a = this.properties.columnasAgrupacion
            a = a.replace(/'/g, '"');
            a = JSON.parse(a);
            return a;
        } catch (error) {
            console.error('Error parseando las columnas de agrupación:', error);
            return [];
        }
    }

    private _obtenerColumnasFiltro(): any {
       
        try {
           
            var a = this.properties.camposAfiltrar
            a = a.replace(/'/g, '"');
            a = JSON.parse(a);
            return a;
        } catch (error) {
            console.error('Error parseando las columnas de agrupación:', error);
            return [];
        }
    }

    private _obtenerOrdenamiento(): any {
       
        try {
           
            var a = this.properties.ordenamiento
            a = a.replace(/'/g, '"');
            a = JSON.parse(a);
            return a;
        } catch (error) {
            console.error('Error parseando las columnas de agrupación:', error);
            return [];
        }
    }


    

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement);
    }

    protected get dataVersion(): Version {
        return Version.parse('1.0');
    }

    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
        return {
            pages: [
                {
                    header: { description: "Configuración de la grilla" },
                    groups: [
                        {
                            groupName: "Opciones",
                            groupFields: [
                                PropertyPaneTextField('columnas', {
                                    label: "Columnas (JSON)",
                                    description: "Ejemplo: [{ \"internalName\": \"Title\", \"displayName\": \"Nombre\" }]",
                                    value: '[{"internalName": "LinkFilename", "displayName": "Nombre"}, {"internalName": "sgdCompania", "displayName": "Compañía"}, {"internalName": "sgdBU", "displayName": "Unidad de Negocio"}, {"internalName": "sgdTipoDocumento", "displayName": "Tipo de Documento"}]'
                                }),
                                PropertyPaneTextField('columnasAgrupacion', { // Nuevo campo para agrupación
                                    label: "Columnas de Agrupación (JSON)",
                                    description: "Ejemplo de internal name: [\"sgdBU\", \"sgdCompania\"]",
                                    value: '[\"sgdCompania\", \"sgdBU\"]' // Valor por defecto
                                }),
                                PropertyPaneTextField('biblioteca', {
                                    label: "Biblioteca de documentos",
                                    description: "Nombre de la biblioteca donde se encuentran los documentos",
                                    value: "Documentos Públicos"
                                }),
                                PropertyPaneTextField('camposAfiltrar', {
                                    label: "Columnas a filtrar",
                                    description: "Ejemplo de columnas a filtrar, Sólo de tipo texto: [\"FileLeafRef\", \"Title\"]",
                                    value: "[\"FileLeafRef\",\"Title\",\"sgdBU\",\"sgdCompania\",\"sgdTipoDocumento\"]"
                                }),
                                PropertyPaneTextField('ordenamiento', {
                                    label: "Ordenamiento de columnas (JSON)",
                                    description: 'Ejemplo: [{ "internalName": "sgdBU", "orden": "asc" },{ "internalName": "sgdCompania", "orden": "asc" },{ "internalName": "sgdTipoDocumento", "orden": "asc" }]',
                                    value: "[{ \"internalName\": \"sgdBU\", \"orden\": \"asc\" }, { \"internalName\": \"sgdCompania\", \"orden\": \"asc\" }, { \"internalName\": \"sgdTipoDocumento\", \"orden\": \"asc\" }]"
                                }),
                                


                            ]
                        }
                    ]
                }
            ]
        };
    }
}