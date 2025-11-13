import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
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

interface Transaction {
  id: number;
  materialId: number;
  materialName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  note: string;
}

interface Order {
  id: number;
  materialId: number;
  materialName: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

export default function Index() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: 'Мука пшеничная', description: 'Высший сорт', currentStock: 150, minStock: 50, price: 45, unit: 'кг', status: 'in-stock' },
    { id: 2, name: 'Дрожжи', description: 'Сухие активные', currentStock: 8, minStock: 5, price: 180, unit: 'кг', status: 'medium' },
    { id: 3, name: 'Сахар', description: 'Кристаллический', currentStock: 45, minStock: 20, price: 55, unit: 'кг', status: 'in-stock' },
    { id: 4, name: 'Масло сливочное', description: '82.5% жирности', currentStock: 12, minStock: 10, price: 680, unit: 'кг', status: 'low' },
    { id: 5, name: 'Яйца', description: 'Куриные С0', currentStock: 180, minStock: 100, price: 8, unit: 'шт', status: 'medium' },
    { id: 6, name: 'Соль', description: 'Экстра', currentStock: 25, minStock: 10, price: 15, unit: 'кг', status: 'in-stock' },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, materialId: 1, materialName: 'Мука пшеничная', type: 'in', quantity: 100, date: '2025-11-10', note: 'Поставка от ООО Зерно' },
    { id: 2, materialId: 4, materialName: 'Масло сливочное', type: 'out', quantity: 5, date: '2025-11-12', note: 'Списание на производство' },
    { id: 3, materialId: 2, materialName: 'Дрожжи', type: 'out', quantity: 2, date: '2025-11-13', note: 'Производство хлеба' },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: 1, materialId: 4, materialName: 'Масло сливочное', quantity: 20, status: 'pending', date: '2025-11-15' },
    { id: 2, materialId: 2, materialName: 'Дрожжи', quantity: 10, status: 'pending', date: '2025-11-16' },
  ]);

  const [newTransaction, setNewTransaction] = useState({
    materialId: 0,
    type: 'out' as 'in' | 'out',
    quantity: 0,
    note: '',
  });

  const [newOrder, setNewOrder] = useState({
    materialId: 0,
    quantity: 0,
  });

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || material.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const criticalMaterials = materials.filter(m => m.currentStock <= m.minStock);

  const getStatusBadge = (status: Material['status']) => {
    const statusConfig = {
      'in-stock': { label: 'В наличии', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'medium': { label: 'Средний', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'low': { label: 'Низкий', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    const config = statusConfig[status];
    return <Badge className={config.className}><Icon name="AlertCircle" size={14} className="mr-1" />{config.label}</Badge>;
  };

  const handleWriteOff = (materialId: number, quantity: number) => {
    setMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        const newStock = m.currentStock - quantity;
        let newStatus: Material['status'] = 'in-stock';
        if (newStock <= m.minStock) newStatus = 'low';
        else if (newStock <= m.minStock * 1.5) newStatus = 'medium';
        return { ...m, currentStock: newStock, status: newStatus };
      }
      return m;
    }));

    const material = materials.find(m => m.id === materialId);
    if (material) {
      setTransactions(prev => [{
        id: prev.length + 1,
        materialId,
        materialName: material.name,
        type: 'out',
        quantity,
        date: new Date().toISOString().split('T')[0],
        note: newTransaction.note || 'Списание',
      }, ...prev]);
    }
  };

  const handleCreateOrder = () => {
    const material = materials.find(m => m.id === newOrder.materialId);
    if (material && newOrder.quantity > 0) {
      setOrders(prev => [{
        id: prev.length + 1,
        materialId: newOrder.materialId,
        materialName: material.name,
        quantity: newOrder.quantity,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
      }, ...prev]);
      setNewOrder({ materialId: 0, quantity: 0 });
    }
  };

  const handleCompleteOrder = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setMaterials(prev => prev.map(m => {
        if (m.id === order.materialId) {
          const newStock = m.currentStock + order.quantity;
          let newStatus: Material['status'] = 'in-stock';
          if (newStock <= m.minStock) newStatus = 'low';
          else if (newStock <= m.minStock * 1.5) newStatus = 'medium';
          return { ...m, currentStock: newStock, status: newStatus };
        }
        return m;
      }));

      setTransactions(prev => [{
        id: prev.length + 1,
        materialId: order.materialId,
        materialName: order.materialName,
        type: 'in',
        quantity: order.quantity,
        date: new Date().toISOString().split('T')[0],
        note: 'Поступление по заказу',
      }, ...prev]);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' as const } : o));
    }
  };

  const exportToExcel = (type: 'materials' | 'transactions' | 'orders') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'materials') {
      data = materials.map(m => ({
        'ID': m.id,
        'Название': m.name,
        'Описание': m.description,
        'Текущий запас': `${m.currentStock} ${m.unit}`,
        'Минимальный запас': `${m.minStock} ${m.unit}`,
        'Цена': `${m.price} ₽`,
        'Статус': m.status === 'in-stock' ? 'В наличии' : m.status === 'medium' ? 'Средний' : 'Низкий'
      }));
      filename = 'Материалы';
    } else if (type === 'transactions') {
      data = transactions.map(t => ({
        'ID': t.id,
        'Материал': t.materialName,
        'Тип': t.type === 'in' ? 'Приход' : 'Расход',
        'Количество': t.quantity,
        'Дата': t.date,
        'Примечание': t.note
      }));
      filename = 'Транзакции';
    } else if (type === 'orders') {
      data = orders.map(o => ({
        'ID': o.id,
        'Материал': o.materialName,
        'Количество': o.quantity,
        'Статус': o.status === 'pending' ? 'В ожидании' : o.status === 'completed' ? 'Выполнен' : 'Отменен',
        'Дата': o.date
      }));
      filename = 'Заказы';
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, filename);
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление материалами</h1>
            <p className="text-gray-600">Система учета складских запасов</p>
          </div>
        </div>

        {criticalMaterials.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <Icon name="AlertTriangle" className="text-red-600" size={20} />
            <AlertDescription className="text-red-800 ml-2">
              <strong>Внимание! Низкий запас</strong>
              <br />
              У {criticalMaterials.length} {criticalMaterials.length === 1 ? 'товара' : 'товаров'} критично низкий уровень запаса. Необходимо пополнение.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="materials">
              <Icon name="Package" size={16} className="mr-2" />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <Icon name="ArrowRightLeft" size={16} className="mr-2" />
              Транзакции
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Icon name="ShoppingCart" size={16} className="mr-2" />
              Заказы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex gap-4 mb-6 items-center">
                <Button 
                  onClick={() => exportToExcel('materials')} 
                  variant="outline"
                  className="shrink-0"
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Экспорт в Excel
                </Button>
                <div className="relative flex-1">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Поиск по названию или описанию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="in-stock">В наличии</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Название</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Описание</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Текущий запас</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Мин. запас</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Цена</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Статус</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => (
                      <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">{material.id}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{material.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{material.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{material.currentStock} {material.unit}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{material.minStock} {material.unit}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{material.price} ₽</td>
                        <td className="py-3 px-4">{getStatusBadge(material.status)}</td>
                        <td className="py-3 px-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                Списать
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Списать материал: {material.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Количество для списания</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    onChange={(e) => setNewTransaction({ ...newTransaction, materialId: material.id, quantity: Number(e.target.value) })}
                                  />
                                </div>
                                <div>
                                  <Label>Примечание</Label>
                                  <Input
                                    placeholder="Причина списания..."
                                    onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    handleWriteOff(material.id, newTransaction.quantity);
                                    setNewTransaction({ materialId: 0, type: 'out', quantity: 0, note: '' });
                                  }}
                                >
                                  Подтвердить списание
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Icon name="History" size={20} className="mr-2" />
                  История транзакций
                </h2>
                <Button 
                  onClick={() => exportToExcel('transactions')} 
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
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Icon name="ShoppingCart" size={20} className="mr-2" />
                  Заказы на пополнение
                </h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => exportToExcel('orders')} 
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}