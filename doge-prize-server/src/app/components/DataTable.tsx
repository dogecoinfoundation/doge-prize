import { motion } from 'framer-motion';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onDelete?: (id: number) => void;
}

export function DataTable({ title, columns, data, onDelete }: DataTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 
                 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 
                       bg-clip-text text-transparent">{title}</h2>
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
          {data.length}
        </div>
      </div>
      
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300
                           border-b border-gray-200 dark:border-gray-700"
                >
                  {column.header}
                </th>
              ))}
              {onDelete && <th className="w-16 px-4 py-3 border-b border-gray-200 dark:border-gray-700"></th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.05 }}
                className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-150"
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-gray-800 dark:text-gray-200
                                               border-b border-gray-100 dark:border-gray-800">
                    {column.render ? column.render(row[column.accessor]) : row[column.accessor]}
                  </td>
                ))}
                {onDelete && (
                  <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => onDelete(row.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                               p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td 
                  colSpan={columns.length + (onDelete ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
} 