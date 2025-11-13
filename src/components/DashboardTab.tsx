import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface DashboardTabProps {
  materials: Material[];
  criticalMaterials: Material[];
  dashboardData: {
    statusCount: {
      'in-stock': number;
      'medium': number;
      'low': number;
    };
    pieData: Array<{ name: string; value: number; color: string }>;
    stockData: Array<{ name: string; 'Текущий запас': number; 'Мин. запас': number }>;
    transactionsByType: {
      in: number;
      out: number;
    };
    totalValue: number;
    orderStats: {
      pending: number;
      completed: number;
    };
  };
}

export default function DashboardTab({ materials, criticalMaterials, dashboardData }: DashboardTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего материалов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{materials.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Общая стоимость</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{dashboardData.totalValue.toLocaleString()} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Критичных запасов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalMaterials.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Активных заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dashboardData.orderStats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Уровни запасов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Текущий запас" fill="#3b82f6" />
                <Bar dataKey="Мин. запас" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Активность транзакций</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Приход</p>
                <p className="text-2xl font-bold text-green-700">{dashboardData.transactionsByType.in}</p>
              </div>
              <Icon name="ArrowDown" className="text-green-600" size={32} />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Расход</p>
                <p className="text-2xl font-bold text-orange-700">{dashboardData.transactionsByType.out}</p>
              </div>
              <Icon name="ArrowUp" className="text-orange-600" size={32} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
