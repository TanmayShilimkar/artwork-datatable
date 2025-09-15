import { useEffect, useState, useRef } from "react";
import { PrimeReactProvider } from "primereact/api";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

interface Data {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

const Table: React.FC = () => {
  const [artworks, setArtworks] = useState<Data[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArtworks, setSelectedArtworks] = useState<Data[] | null>(null);
  const [page, setPage] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedRowsCount, setSelectedRowsCount] = useState<string>('');
  const rowsPerPage = 12;
  const op = useRef<OverlayPanel>(null);

  const fetchArtworks = async (pageNumber: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pageNumber + 1}&limit=${rowsPerPage}`
      );
      const json = await response.json();
      setArtworks(json.data);
      setTotalRecords(json.pagination.total);
    } catch (error) {
      console.error("Fetching error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  const onPageChange = (event: any) => {
    setPage(event.page);
  };

  const handleSelectRows = async () => {
    const count = parseInt(selectedRowsCount);
    
    if (isNaN(count) || count <= 0) {
        return;
    }

    if (count <= artworks.length) {
        const newSelection = artworks.slice(0, count);
        setSelectedArtworks(newSelection);
        op.current?.hide();
    } else {
        let remainingToSelect = count - artworks.length;
        let nextPage = page + 1;
        let newSelection = [...artworks];

        setLoading(true);
        try {
          while (remainingToSelect > 0 && nextPage * rowsPerPage < totalRecords) {
              const response = await fetch(
                  `https://api.artic.edu/api/v1/artworks?page=${nextPage + 1}&limit=${rowsPerPage}`
              );
              const json = await response.json();
              const nextArtworks: Data[] = json.data;

              if (!nextArtworks || nextArtworks.length === 0) break; // no more rows

              const toTake = Math.min(remainingToSelect, nextArtworks.length);
              newSelection = [...newSelection, ...nextArtworks.slice(0, toTake)];
              remainingToSelect -= toTake;

              nextPage++;
          }

          setSelectedArtworks(newSelection);
          op.current?.hide();
      } catch (error) {
          console.error("Fetching error:", error);
      } finally {
          setLoading(false);
      }
    }
  };

  const headerTemplate = (options: any) => {
    return (
      <div style={{order:"2"}}>
        {options.headerCheckbox}
        <i className="pi pi-angle-down cursor-pointer" onClick={(e) => op.current?.toggle(e)} style={{padding:"5px"}}></i>
      </div>
    );
  };

  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <style>
        {`
          .p-column-title {
            order: 2;
          }
        `}
      </style>
      <div className="p-m-4">
        <h2 className="p-text" style={{textAlign:"center"}}>Artworks Data Table</h2>
        <div className="card">
          <DataTable
            value={artworks}
            lazy
            paginator
            first={page * rowsPerPage}
            rows={rowsPerPage}
            totalRecords={totalRecords}
            onPage={onPageChange}
            stripedRows
            loading={loading}
            selection={selectedArtworks}
            onSelectionChange={(e) => setSelectedArtworks(e.value as Data[])}
            dataKey="id"
            tableStyle={{ minWidth: '50rem' , padding: '0 20px'}}
          >
            <Column
              selectionMode="multiple"
              header={headerTemplate}
              style={{display:"flex"}}
            ></Column>
            <Column field="title" header="Title" />
            <Column field="place_of_origin" header="Place of Origin" />
            <Column field="artist_display" header="Artist Display" />
            <Column field="inscriptions" header="Inscriptions" />
            <Column field="date_start" header="Start Date" />
            <Column field="date_end" header="End Date" />
          </DataTable>
        </div>
      </div>
      
      <OverlayPanel ref={op}>
        <div className="p-flex p-flex-column p-ai-center">
          <InputText
            value={selectedRowsCount}
            onChange={(e) => setSelectedRowsCount(e.target.value)}
            placeholder="Select rows..."
          />
          <Button
            label="submit"
            className="p-mt-2"
            onClick={handleSelectRows}
          />
        </div>
      </OverlayPanel>
    </PrimeReactProvider>
  );
};

export default Table;