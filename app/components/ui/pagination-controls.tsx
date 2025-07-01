import { ChevronDoubleLeft, ChevronDoubleRight } from "@mynaui/icons-react";
import React from "react";

interface PaginationProps {
  totalItems: number;
  rowsPerPage: number;
  currentPage: number;
  setRowsPerPage: (value: number) => void;
  setCurrentPage: (value: number) => void;
}

export function PaginationControls({
  totalItems,
  rowsPerPage,
  currentPage,
  setRowsPerPage,
  setCurrentPage,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  return (
    <div className={`flex justify-between items-center mt-4 px-4 ${totalItems === 0 ? "hidden" : ""}`}>
      <div className="flex items-center gap-2">
        <select
          id="rowsPerPage"
          className="border rounded px-2 py-1 bg-white outline-none text-[#5D5D5D]"
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {[5, 10, 50].map((num) => (
            <option key={num} value={num} className="bg-white">{num}</option>
          ))}
        </select>
        <span className="text-sm text-[#5D5D5D]">data per page</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-2 py-1 border rounded disabled:opacity-50 bg-white"
        >
          <ChevronDoubleLeft className="text-[#5D5D5D]"/>
        </button>
        <span className="text-sm text-[#5D5D5D]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-2 py-1 border rounded disabled:opacity-50 bg-white"
        >
          <ChevronDoubleRight  className="text-[#5D5D5D]"/>
        </button>
      </div>
    </div>
  );
}
