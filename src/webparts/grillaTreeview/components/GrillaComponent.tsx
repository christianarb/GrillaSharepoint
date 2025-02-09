import * as React from 'react';
import { useState, useEffect } from 'react';
import { GroupedList, IGroup, IGroupHeaderProps } from '@fluentui/react/lib/GroupedList';
import { Selection, SelectionMode, SelectionZone } from '@fluentui/react/lib/Selection';
import { AiFillFilePdf, AiFillFileWord, AiFillFileExcel } from 'react-icons/ai';
import { Folder, FolderOpen, FileText, Search } from 'lucide-react';
import styles from './Grilla.module.scss';
import { spservices } from "../../../SPServices/spservices";


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
    const registrosPorPagina = 4999;

    const selection = new Selection();

    useEffect(() => {
        debugger;
        cargarDocumentos(paginaActual);
    }, [paginaActual]);

    const cargarDocumentos = async (pagina: number) => {
        setLoading(true);
        setError(null);
        try {
            const startRow = (pagina - 1) * registrosPorPagina;
            const resultados = await _services.obtenerDocumentos(
                startRow,
                registrosPorPagina,
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
        const items: Documento[] = [];
        const groups: IGroup[] = [];
        let startIndex = 0;

        const crearGruposRecursivos = (
            docs: Documento[],
            campos: string[],
            nivel: number,
            parentKey: string = ''
        ): IGroup[] => {
            if (campos.length === 0) return [];

            const campoActual = campos[0];
            const agrupado = docs.reduce((acc, doc) => {
                const clave = doc[campoActual] || `Sin ${campoActual}`;
                if (!acc[clave]) acc[clave] = [];
                acc[clave].push(doc);
                return acc;
            }, {} as Record<string, Documento[]>);

            return Object.keys(agrupado).map((clave, index) => {
               
                const documentosGrupo = agrupado[clave];
                const groupKey = `${parentKey}-${clave}-${index}`;
                const startIndexBackup = startIndex;

                const subGrupos = crearGruposRecursivos(documentosGrupo, campos.slice(1), nivel + 1, groupKey);

                items.push(...documentosGrupo);
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
        };

        const gruposRaiz = crearGruposRecursivos(documentos, columnasAgrupacion, 0);
        groups.push(...gruposRaiz);
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
                        <b style={{ color: '#140a9a' }}>{campoAgrupador.displayName}:</b>{" "}
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

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const imagePath =  require('../assets/icpdf.png');
  

        switch (extension) {
            case 'pdf':
                return <img src={imagePath} className={styles.fileIcon} />
    
            case 'doc':
            case 'docx':
                return <AiFillFileWord className={styles.fileIcon} />;
            case 'xls':
            case 'xlsx':
                return <AiFillFileExcel className={styles.fileIcon} />;
            default:
                return <FileText className={styles.fileIcon} />;
        }
    };

    return (
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
                            const startRow = (paginaActual - 1) * registrosPorPagina;
                            const resultados = await _services.obtenerDocumentos(
                                startRow,
                                registrosPorPagina,
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
                            }}
                        />
                    </SelectionZone>
                </div>
            )}
        </div>
    );
};
