import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';

interface Transaction {
  id: number;
  materialId: number;
  materialName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  note: string;
}

interface TransactionsTabProps {
  transactions: Transaction[];
}

export default function TransactionsTab({ transactions }: TransactionsTabProps) {
  const exportToExcel = () => {
    const data = transactions.map(t => ({
      'ID': t.id,
      'Материал': t.materialName,
      'Тип': t.type === 'in' ? 'Приход' : 'Расход',
      'Количество': t.quantity,
      'Дата': t.date,
      'Примечание': t.note
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Транзакции');
    XLSX.writeFile(workbook, `Транзакции_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Icon name="History" size={20} className="mr-2" />
          История транзакций
        </h2>
        <Button 
          onClick={exportToExcel} 
          variant="outline"
        >
          <Icon name="Download" size={16} className="mr-2" />
          Экспорт в Excel
        </Button>
      </div>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={transaction.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    <Icon name={transaction.type === 'in' ? 'ArrowDown' : 'ArrowUp'} size={14} className="mr-1" />
                    {transaction.type === 'in' ? 'Приход' : 'Расход'}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">{transaction.materialName}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Количество: <span className="font-semibold">{transaction.quantity}</span></p>
                <p className="text-xs text-gray-500">{transaction.note}</p>
              </div>
              <span className="text-xs text-gray-500">{transaction.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
