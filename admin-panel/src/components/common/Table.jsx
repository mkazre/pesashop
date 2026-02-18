import React from 'react';
import classNames from 'classnames';

const Table = ({ columns, data, onRowClick, loading = false, emptyMessage = 'No data available' }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key ?? column.accessor ?? `col-${index}`}
                className={classNames({
                  'text-right': column.align === 'right',
                  'text-center': column.align === 'center',
                })}
                style={{ width: column.width }}
              >
                {column.title || column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row._id || row.id || `row-${rowIndex}`}
              onClick={() => onRowClick && onRowClick(row)}
              className={classNames({
                'cursor-pointer': onRowClick,
              })}
            >
              {columns.map((column, colIndex) => {
                const accessor = column.key || column.accessor;
                const cellValue = accessor ? row[accessor] : null;
                return (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={classNames({
                      'text-right': column.align === 'right',
                      'text-center': column.align === 'center',
                    })}
                  >
                    {column.cell
                      ? column.cell(row)
                      : column.render
                      ? column.render(cellValue, row)
                      : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
