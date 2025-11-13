import { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import MaterialsTab from '@/components/MaterialsTab';
import TransactionsTab from '@/components/TransactionsTab';
import OrdersTab from '@/components/OrdersTab';
import DashboardTab from '@/components/DashboardTab';

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

  const dashboardData = useMemo(() => {
    const statusCount = {
      'in-stock': materials.filter(m => m.status === 'in-stock').length,
      'medium': materials.filter(m => m.status === 'medium').length,
      'low': materials.filter(m => m.status === 'low').length,
    };

    const pieData = [
      { name: 'В наличии', value: statusCount['in-stock'], color: '#86efac' },
      { name: 'Средний', value: statusCount['medium'], color: '#fde047' },
      { name: 'Низкий', value: statusCount['low'], color: '#fca5a5' },
    ];

    const stockData = materials.map(m => ({
      name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
      'Текущий запас': m.currentStock,
      'Мин. запас': m.minStock,
    }));

    const transactionsByType = {
      in: transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0),
      out: transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0),
    };

    const totalValue = materials.reduce((sum, m) => sum + (m.currentStock * m.price), 0);

    const orderStats = {
      pending: orders.filter(o => o.status === 'pending').length,
      completed: orders.filter(o => o.status === 'completed').length,
    };

    return {
      statusCount,
      pieData,
      stockData,
      transactionsByType,
      totalValue,
      orderStats,
    };
  }, [materials, transactions, orders]);

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

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="dashboard">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Дашборд
            </TabsTrigger>
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

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab
              materials={materials}
              criticalMaterials={criticalMaterials}
              dashboardData={dashboardData}
            />
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <MaterialsTab
              materials={materials}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              filteredMaterials={filteredMaterials}
              handleWriteOff={handleWriteOff}
              newTransaction={newTransaction}
              setNewTransaction={setNewTransaction}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionsTab transactions={transactions} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrdersTab
              orders={orders}
              materials={materials}
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              handleCreateOrder={handleCreateOrder}
              handleCompleteOrder={handleCompleteOrder}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
