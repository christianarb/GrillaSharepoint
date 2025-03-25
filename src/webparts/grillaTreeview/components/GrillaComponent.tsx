import * as React from 'react';
import { useState, useEffect,useMemo } from 'react';
import { GroupedList, IGroup, IGroupHeaderProps, IGroupFooterProps} from '@fluentui/react/lib/GroupedList';
import { Selection, SelectionMode, SelectionZone } from '@fluentui/react/lib/Selection';
import { AiFillFilePdf, AiFillFileWord, AiFillFileExcel } from 'react-icons/ai';
import { Folder, FolderOpen, FileText, Search } from 'lucide-react';
import styles from './Grilla.module.scss';
import { spservices } from "../../../SPServices/spservices";
import { createTheme, ThemeProvider } from '@fluentui/react';
import { useTable, usePagination,useSortBy  } from 'react-table';

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
    camposAfiltrar:string[];
    ordenamiento: any[];
}

export const GrillaComponente: React.FC<GrillaDocumentosProps> = ({
    SpContext,
    columnas,
    columnasAgrupacion,
    biblioteca,
    camposAfiltrar,
    ordenamiento
}) => {
    debugger;

    const _services = new spservices(SpContext);
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const totalDeRegistros = 4999;
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Usar un Set para manejar los grupos expandidos
    const [columnasListas, setColumnasListas] = useState<any[]>([]);
    

    const selection = new Selection();

        // Función para manejar la expansión y colapso de los grupos
        const toggleGroupExpansion = (groupKey: string) => {
            setExpandedGroups(prevState => {
                const newExpandedGroups = new Set(prevState);
                if (newExpandedGroups.has(groupKey)) {
                    newExpandedGroups.delete(groupKey);
                } else {
                    newExpandedGroups.add(groupKey);
                }
                return newExpandedGroups;
            });
        };

    useEffect(() => {
        debugger;
        cargarDocumentos(paginaActual);
    }, [paginaActual]);

    const cargarDocumentos = async (pagina: number) => {
        setLoading(true);
        setError(null);
        try {
            debugger;
            const startRow = (pagina - 1) * totalDeRegistros;



            const resultados = await _services.obtenerDocumentos(
                startRow,
                totalDeRegistros,
                columnas,
                biblioteca,
                ordenamiento,
                searchTerm,
                camposAfiltrar,
                columnasAgrupacion
            );
            setDocumentos(resultados);
            debugger;
            const campos = await _services.ObetenerColumnas(biblioteca);
            setColumnasListas(campos);
            console.log(campos);

        } catch (error) {
            console.error('Error loading documents:', error);
            setError('Error loading documents. Please try again later.');
            setDocumentos([]);
        } finally {
            setLoading(false);
        }
    };

  
 

  
    

  
  const DownloadFileDirect = (fileRelativeUrl) => {
    debugger;
    const tenantUrl = SpContext.pageContext.web.absoluteUrl;
    const downloadUrl = `${tenantUrl}/_layouts/15/download.aspx?SourceUrl=${encodeURIComponent(fileRelativeUrl)}`;
    window.location.href = downloadUrl; // Redirige al archivo para descargarlo
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
                    isCollapsed: !expandedGroups.has(groupKey), // Usar el estado de expansión
                    children: subGrupos.length > 0 ? subGrupos : null,
                    data:documentosGrupo
                };
            });

            // Ordenar los grupos por su clave de agrupación (puedes cambiar esto si necesitas otro criterio)
            return grupos; //.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar por nombre
        };

        // Iniciar la agrupación recursiva
        const gruposRaiz = crearGruposRecursivos(documentos, columnasAgrupacion, 0, 0);
        
        // Ordenar los grupos raíz por su nombre
       // gruposRaiz.sort((a, b) => a.name.localeCompare(b.name));

        // Añadir los grupos raíz a la lista de grupos
        groups.push(...gruposRaiz);

      
        return { items, groups };

    }, [documentos, columnasAgrupacion,expandedGroups]); // Solo volver a calcular si cambian los documentos o columnas

    return { items, groups };
};





// onRenderHeader para manejar la expansión y el colapso
const onRenderHeader = (props?: IGroupHeaderProps): JSX.Element | null => {
    if (props && props.group) {
        const toggleCollapse = (): void => {
            toggleGroupExpansion(props.group.key); // Cambiar el estado de expansión del grupo
        };

        let datos = props.group.level;
        let agrupador = columnasAgrupacion[datos];
        let campoAgrupador = columnas.filter(x => x.internalName == agrupador);

        let titeloAgrupador = '';
        if(campoAgrupador.length == 0){
            titeloAgrupador = columnasListas.filter(x => x.InternalName== agrupador)[0].Title; 
        }else{
            titeloAgrupador = campoAgrupador[0].displayName;
        }

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
                <img src={imagePath} alt={props.group?.isCollapsed ? 'Carpeta cerrada' : 'Carpeta abierta'} className={styles.groupIcon} />

                <span>
                    <div style={{ color: '#140a9a' }}>{titeloAgrupador}: <strong style={{ color: '#444444', fontWeight: 'bold' }}>{props.group?.name} ({props.group?.count})</strong> 
                    </div>                    
                </span>

               
            </div>
            
          
        );
    }

    return null;
};

const onRenderCell = (nestingDepth?: number, item?: Documento, itemIndex?: number , group?: IGroup): React.ReactNode => {
    debugger;

    console.log(item);
    console.log(group);
    return item? (
        <div className={styles.detailsRow}>           
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




const DataTable: React.FC<{ data: Documento[], columnas: IColumnConfig[] }> = ({ data, columnas }) => {
    // Define las columnas para la tabla
    const columns = React.useMemo(
        () => columnas.map(col => ({
            Header: col.displayName,
            accessor: col.internalName
        })),
        [columnas]
    );

    // Usa el hook useTable con paginación y ordenación
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        canPreviousPage,
        canNextPage,
        page,
        gotoPage,
        pageCount,
        state: { pageIndex, pageSize, sortBy },
        getTableSortByProps, // Esto es importante para el ordenamiento
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0, pageSize: 10 },
        },
        useSortBy,  // Agregar el hook useSortBy para manejar la ordenación
        usePagination
    );

    /*
    <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th
                                    {...column.getHeaderProps(column.getSortByToggleProps())} // Hacer que los encabezados sean clickeables para ordenar
                                    className={styles.tableHeaderCell}
                                >
                                    {column.render('Header')}
                              
                                    <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? ' 🔽'  // Orden descendente
                                                : ' 🔼'  // Orden ascendente
                                            : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
    */

    return (
        <div className={styles.dataTableWrapper}>
            <table {...getTableProps()} className={styles.dataTable}>

           
            
            
               
                <tbody {...getTableBodyProps()}>
                    {page.map(row => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map(cell => {
                                    const col = cell.column;
                                    return (
                                        <td {...cell.getCellProps()} className={styles.tableCell}>
                                            {col.id === 'LinkFilename' ? (
                                                <a
                                                    href={row.original['FileRef']}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.fileName}
                                                    onClick={() => {
                                                        console.log(row.original);
                                                        DownloadFileDirect(row.original.File.ServerRelativeUrl);
                                                    }}
                                                    style={{ textDecoration: 'underline', color: 'blue', cursor: 'pointer' }}
                                                >
                                                    {getFileIcon(row.original[col.id])}
                                                    {row.original[col.id]}
                                                </a>
                                            ) : 
                                            (
                                                formatDate(row.original[col.id],col.id)
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className={styles.paginationControls}>
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className={styles.paginationButton}>
                    {'<<'}
                </button>
                <button onClick={() => gotoPage(pageIndex - 1)} disabled={!canPreviousPage} className={styles.paginationButton}>
                    {'<'}
                </button>
                <button onClick={() => gotoPage(pageIndex + 1)} disabled={!canNextPage} className={styles.paginationButton}>
                    {'>'}
                </button>
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} className={styles.paginationButton}>
                    {'>>'}
                </button>
                <span className={styles.paginationText}>
                    Página {pageIndex + 1} de {pageCount}
                </span>
            </div>
        </div>
    );
};

const formatDate = (value,columna) => {
    // Si el valor es null o undefined, devolver "-"
    if (value === null || value === undefined) return '-';

    // Si el valor es un número, devolverlo tal cual (esto evita que 0 se transforme en "-")
    if (typeof value === 'number') return value;

    if (value === '0'  || value === 0) return value;

    // Si el valor no es un string, devolverlo sin modificaciones
    //if (typeof value !== 'string') return value;

    // Verifica si el valor es una fecha en formato ISO 8601
    const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
    if (!isDate) return value; // Si no es una fecha ISO, devuelve el valor original

    // Convierte a objeto Date y valida si es una fecha válida
    const date = new Date(value);
    if (isNaN(date.getTime())) return value; // Si no es una fecha válida, devuelve el valor original

    // Formatea la fecha a dd/MM/yyyy
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};



// onRenderFooter para mostrar el DataTable solo si el grupo está expandido
const onRenderFooter = (props?: IGroupFooterProps): JSX.Element | null => {
    if (props && props.group && props.group.level === columnasAgrupacion.length - 1) {
        debugger;
        let datos = props.group.data.sort((a, b) => a.LinkFilename.localeCompare(b.LinkFilename));
        
        return (
            <div className={styles.ultimoNivel}
                style={{ '--nivel': props.group!.level } as React.CSSProperties}>
                {/* Mostrar el DataTable solo si el grupo está expandido */}
                {!props.group?.isCollapsed && (
                   // <div style={{ overflowX: 'auto', width: '100%' }}>
                       // <div style={{  width: '800px' }}>
                            <DataTable data={datos} columnas={columnas} />
                       // </div>
                   // </div>
                )}
            </div>
        );
    }
    return null;
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


    const { items, groups } = agruparDocumentosDinamico();

    function sanitizeSearchTerm(term: string): string {
        return term.replace(/'/g, "''")
       // return encodeURIComponent(term.replace(/'/g, "''")); // Escapar comillas y codificar caracteres especiales
    }

    const debounceTimeout = 1000; // Tiempo de espera en ms

    useEffect(() => {
        const debounceSearch = setTimeout(async () => {
         // if (searchTerm.trim()) 
            {
            const startRow = (paginaActual - 1) * totalDeRegistros;
            const resultados = await _services.obtenerDocumentos(
              startRow,
              totalDeRegistros,
              columnas,
              biblioteca,
              ordenamiento,
              sanitizeSearchTerm(searchTerm),
              camposAfiltrar,
              columnasAgrupacion
            );
            setDocumentos(resultados);
          }
        }, debounceTimeout);
    
        return () => clearTimeout(debounceSearch); // Limpiar timeout al cambiar el término de búsqueda
      }, [searchTerm, paginaActual]);
     
    

    return (
        <ThemeProvider theme={theme}>
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Buscar un documento..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                  
                        <GroupedList
                            items={[]}
                            groups={groups}                            
                            onRenderCell={onRenderCell}
                            selectionMode={SelectionMode.single}
                            groupProps={{
                                onRenderHeader,
                                onRenderFooter                                
                            }}
                        />
                   
                </div>
            )}
        </div>
        </ThemeProvider>
    );
};
