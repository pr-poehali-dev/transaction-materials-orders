import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';

interface Material {
  id: number;
  name: string;
  description: string;
  currentStock: number;
  minStock: number;
  price: number;
  unit: string;
  status: 'in-stock' | 'medium' | 'low';
}

interface Order {
  id: number;
  materialId: number;
  materialName: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

interface OrdersTabProps {
  orders: Order[];
  materials: Material[];
  newOrder: {
    materialId: number;
    quantity: number;
  };
  setNewOrder: (order: any) => void;
  handleCreateOrder: () => void;
  handleCompleteOrder: (orderId: number) => void;
}

export default function OrdersTab({
  orders,
  materials,
  newOrder,
  setNewOrder,
  handleCreateOrder,
  handleCompleteOrder,
}: OrdersTabProps) {
  const exportToExcel = () => {
    const data = orders.map(o => ({
      'ID': o.id,
      'Материал': o.materialName,
      'Количество': o.quantity,
      'Статус': o.status === 'pending' ? 'В ожидании' : o.status === 'completed' ? 'Выполнен' : 'Отменен',
      'Дата': o.date
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Заказы');
    XLSX.writeFile(workbook, `Заказы_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Icon name="ShoppingCart" size={20} className="mr-2" />
          Заказы на пополнение
        </h2>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel} 
            variant="outline"
          >
            <Icon name="Download" size={16} className="mr-2" />
            Экспорт
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Icon name="Plus" size={16} className="mr-2" />
                Создать заказ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый заказ на пополнение</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Материал</Label>
                  <Select onValueChange={(value) => setNewOrder({ ...newOrder, materialId: Number(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите материал" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateOrder}>
                  Создать заказ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={
                    order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {order.status === 'pending' ? 'В ожидании' : order.status === 'completed' ? 'Выполнен' : 'Отменен'}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">{order.materialName}</span>
                </div>
                <p className="text-sm text-gray-600">Количество: <span className="font-semibold">{order.quantity}</span></p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-gray-500">{order.date}</span>
                {order.status === 'pending' && (
                  <Button size="sm" onClick={() => handleCompleteOrder(order.id)} className="bg-green-600 hover:bg-green-700">
                    <Icon name="Check" size={14} className="mr-1" />
                    Завершить
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
