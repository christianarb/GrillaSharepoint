import * as React from 'react';
import { useState, useEffect,useMemo } from 'react';
import { GroupedList, IGroup, IGroupHeaderProps, IGroupFooterProps} from '@fluentui/react/lib/GroupedList';
import { Selection, SelectionMode, SelectionZone } from '@fluentui/react/lib/Selection';
import { AiFillFilePdf, AiFillFileWord, AiFillFileExcel } from 'react-icons/ai';
import { Folder, FolderOpen, FileText, Search } from 'lucide-react';
import styles from './Grilla.module.scss';
import { spservices } from "../../../SPServices/spservices";
import { createTheme, ThemeProvider } from '@fluentui/react';

const theme = createTheme({
    fonts: {
        medium: { fontFamily: 'Segoe UI, sans-serif' },
        large: { fontFamily: 'Segoe UI, sans-serif' },
        small: { fontFamily: 'Segoe UI, sans-serif' }, // Ejemplo: estilo small
      
        // ... otros estilos que uses
    },
    palette: { // Ejemplo: Cambiar colores si es necesario
      themePrimary: '#0078d4', // Color primario
      themeLighterAlt: '#f3f2f1', // Color de fondo para encabezados
      // ... otros colores
    }
});

interface Documento {
    [key: string]: any;
}

export interface IColumnConfig {
    internalName: string;
    displayName: string;
}

interface GrillaDocumentosProps {
    SpContext: any;
    columnas: IColumnConfig[];
    columnasAgrupacion: string[];
    biblioteca: string;
    ordenColumna?: string;
    direccionOrden?: string;
}

export const GrillaComponente: React.FC<GrillaDocumentosProps> = ({
    SpContext,
    columnas,
    columnasAgrupacion,
    biblioteca,
    ordenColumna = 'LinkFilename',
    direccionOrden = 'asc',
}) => {
    const _services = new spservices(SpContext);
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const totalDeRegistros = 4999;

    const selection = new Selection();

    useEffect(() => {
        debugger;
        cargarDocumentos(paginaActual);
    }, [paginaActual]);

    const cargarDocumentos = async (pagina: number) => {
        setLoading(true);
        setError(null);
        try {
            const startRow = (pagina - 1) * totalDeRegistros;
            const resultados = await _services.obtenerDocumentos(
                startRow,
                totalDeRegistros,
                columnas,
                biblioteca,
                ordenColumna,
                direccionOrden,
                searchTerm
            );
            setDocumentos(resultados);
        } catch (error) {
            console.error('Error loading documents:', error);
            setError('Error loading documents. Please try again later.');
            setDocumentos([]);
        } finally {
            setLoading(false);
        }
    };

  
 

    const agruparDocumentosDinamico = (): { items: Documento[]; groups: IGroup[] } => {
        const { items, groups } = useMemo(() => {
            const items: Documento[] = [];
            const groups: IGroup[] = [];
            let startIndex = 0;
    
            // Función recursiva para crear los grupos
            const crearGruposRecursivos = (docs: Documento[], campos: string[], campoIndex: number, nivel: number, parentKey: string = ''): IGroup[] => {
                // Si hemos agotado los campos, terminamos la recursión
                if (campoIndex >= campos.length) return [];
    
                const campoActual = campos[campoIndex];
                const agrupado = new Map<string, Documento[]>();
    
                // Agrupar documentos por el campo actual
                docs.forEach(doc => {
                    const clave = doc[campoActual] || `Sin ${campoActual}`;
                    if (!agrupado.has(clave)) agrupado.set(clave, []);
                    agrupado.get(clave)?.push(doc);
                });
    
                // Mapear las claves agrupadas en los grupos y manejar subgrupos recursivos
                const grupos = Array.from(agrupado.entries()).map(([clave, documentosGrupo], index) => {
                    const groupKey = `${parentKey}-${clave}-${index}`;
                    const startIndexBackup = startIndex;
    
                    // Llamada recursiva para crear subgrupos
                    const subGrupos = crearGruposRecursivos(documentosGrupo, campos, campoIndex + 1, nivel + 1, groupKey);
    
                    // Añadir los documentos al array 'items'
                    documentosGrupo.forEach(doc => items.push(doc));  // push eficiente
                    startIndex += documentosGrupo.length;
    
                    return {
                        key: groupKey,
                        name: clave,
                        startIndex: startIndexBackup,
                        count: documentosGrupo.length,
                        level: nivel,
                        isCollapsed: true,
                        children: subGrupos.length > 0 ? subGrupos : undefined,
                    };
                });
    
                // Ordenar los grupos por su clave de agrupación (puedes cambiar esto si necesitas otro criterio)
                return grupos.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar por nombre
            };
    
            // Iniciar la agrupación recursiva
            const gruposRaiz = crearGruposRecursivos(documentos, columnasAgrupacion, 0, 0);
            
            // Ordenar los grupos raíz por su nombre
            gruposRaiz.sort((a, b) => a.name.localeCompare(b.name));
    
            // Añadir los grupos raíz a la lista de grupos
            groups.push(...gruposRaiz);
    
            // Ordenar todos los grupos (primer, segundo y tercer nivel) por su nivel
            function ordenarGrupos(grupos: IGroup[]): IGroup[] {
                return grupos
                    .sort((a, b) => a.level - b.level) // Primero por nivel
                    .map(group => {
                        if (group.children) {
                            // Si tiene subgrupos, ordenar también recursivamente
                            group.children = ordenarGrupos(group.children);
                        }
                        return group;
                    });
            }
    
            // Aplicar el ordenamiento a todos los grupos
            groups.sort((a, b) => a.level - b.level); // Ordenar los grupos por nivel (primer, segundo, tercer nivel)
            groups.forEach(group => {
                if (group.children) {
                    group.children = ordenarGrupos(group.children);
                }
            });
    
            return { items, groups };
    
        }, [documentos, columnasAgrupacion]); // Solo volver a calcular si cambian los documentos o columnas
    
        return { items, groups };
    };
    
    

    const { items, groups } = agruparDocumentosDinamico();

    const onRenderHeader = (props?: IGroupHeaderProps): JSX.Element | null => {
        if (props && props.group) {
            const toggleCollapse = (): void => {
                props.onToggleCollapse!(props.group!);
            };
    
            let datos = props.group.level;
            let agrupador = columnasAgrupacion[datos];
            let campoAgrupador = columnas.filter(x => x.internalName == agrupador)[0];
    
            // Ruta de la imagen
            const imagePath = props.group?.isCollapsed
              ? require('../assets/folder-close.png')
              : require('../assets/folder-open.png');
    
            return (
                <div
                    className={styles.groupHeader}
                    onClick={toggleCollapse}
                    style={{ '--group-nesting-depth': props.group!.level } as React.CSSProperties}
                >
                    {/* Mostrar la imagen */}
                    <img src={imagePath} alt={props.group?.isCollapsed? 'Carpeta cerrada': 'Carpeta abierta'} className={styles.groupIcon} />
    
                    <span>
                        <div style={{ color: '#140a9a' }}>{campoAgrupador.displayName}:</div>{" "}
                        <strong style={{ color: '#444444', fontWeight: 'bold' }}>
                            {props.group?.name} ({props.group?.count})
                        </strong>
                    </span>
                </div>
            );
        }
    
        return null;
    };

    
  const DownloadFileDirect = (fileRelativeUrl) => {
    debugger;
    const tenantUrl = SpContext.pageContext.web.absoluteUrl;
    const downloadUrl = `${tenantUrl}/_layouts/15/download.aspx?SourceUrl=${encodeURIComponent(fileRelativeUrl)}`;
    window.location.href = downloadUrl; // Redirige al archivo para descargarlo
};
const onRenderCell = (nestingDepth?: number, item?: Documento, itemIndex?: number): React.ReactNode => {
    return item? (
        <div className={styles.detailsRow}>
            <div className={styles.detailsCheckbox}>
                {/*... */}
            </div>
            {columnas.map((col) => (
                <div key={col.internalName} className={styles.tableCell}>
                    {col.internalName === 'LinkFilename'? (
                        <a
                            href={item['FileRef']}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fileName}
                            onClick={() => {
                                console.log(item);
                                DownloadFileDirect(item.File.ServerRelativeUrl)
                            }}
                            style={{ textDecoration: 'underline', color: 'blue', cursor:'pointer' }} // Estilos en línea
                        >
                            {getFileIcon(item[col.internalName])}
                            {item[col.internalName]}
                        </a>
                    ): (
                        item[col.internalName] || '-'
                    )}
                </div>
            ))}
        </div>
    ): null;
};


const onRenderFooter = (props?: IGroupFooterProps): JSX.Element | null => {
    debugger;
    let agrupador = props.group;
    if(agrupador.level == columnasAgrupacion.length -1){
        return <div>Implementar agrupador para: {props.group!.name}</div>;
    }else{
        return null;
    }
  };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        const imagePathPdf =  require('../assets/icpdf.png');
        const imagePathDoc =  require('../assets/icdocx.png');
        const imagePathXsl =  require('../assets/icxlsx.png');
  

        switch (extension) {
            case 'pdf':
                return <img src={imagePathPdf} className={styles.fileIcon} />
    
            case 'doc':
            case 'docx':
                return <img src={imagePathDoc} className={styles.fileIcon} />
            case 'xls':
            case 'xlsx':
                return <img src={imagePathXsl} className={styles.fileIcon} />
            default:
                return <FileText className={styles.fileIcon} />;
        }
    };

    return (
        <ThemeProvider theme={theme}>
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={async (e)  => {
                            debugger;
                            setSearchTerm(e.target.value);
                            const startRow = (paginaActual - 1) * totalDeRegistros;
                            const resultados = await _services.obtenerDocumentos(
                                startRow,
                                totalDeRegistros,
                                columnas,
                                biblioteca,
                                ordenColumna,
                                direccionOrden,
                                e.target.value
                            );
                            setDocumentos(resultados);
                        }

                        }
                    />
                   
                </div>
            </div>

            {loading && <div className={styles.loading}>Cargando documentos...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {!loading && !error && (
                <div>
                    <div className={styles.tableHeader}>
                        {columnas.map((col) => (
                            <div key={col.internalName} className={styles.tableHeaderCell}>
                                {col.displayName.toString().toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <SelectionZone selection={selection} selectionMode={SelectionMode.single}>
                        <GroupedList
                            items={items}
                            groups={groups}
                            
                            onRenderCell={onRenderCell}
                            selectionMode={SelectionMode.single}
                            groupProps={{
                                onRenderHeader,
                                onRenderFooter
                            }}
                        />
                    </SelectionZone>
                </div>
            )}
        </div>
        </ThemeProvider>
    );
};
