import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

export default function Pagination({ currentPage, totalPages, onPageChange, showing }) {
  const pages = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between py-8">
      {/* Showing Info */}
      {showing && (
        <div className="text-sm text-gray-600">
          Showing {showing.from}–{showing.to} of {showing.total} results
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center border-2 transition-colors ${
            currentPage === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 hover:border-primary hover:text-primary'
          }`}
        >
          <IoChevronBack />
        </button>

        {/* First Page */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}

        {/* Page Numbers */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center border-2 transition-colors ${
              currentPage === page
                ? 'bg-primary border-primary text-white'
                : 'border-gray-300 hover:border-primary hover:text-primary'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last Page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center border-2 transition-colors ${
            currentPage === totalPages
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 hover:border-primary hover:text-primary'
          }`}
        >
          <IoChevronForward />
        </button>
      </div>
    </div>
  );
}
