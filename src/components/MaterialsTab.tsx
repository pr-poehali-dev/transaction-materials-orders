import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface MaterialsTabProps {
  materials: Material[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  filteredMaterials: Material[];
  handleWriteOff: (materialId: number, quantity: number) => void;
  newTransaction: {
    materialId: number;
    type: 'in' | 'out';
    quantity: number;
    note: string;
  };
  setNewTransaction: (transaction: any) => void;
}

export default function MaterialsTab({
  materials,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredMaterials,
  handleWriteOff,
  newTransaction,
  setNewTransaction,
}: MaterialsTabProps) {
  const getStatusBadge = (status: Material['status']) => {
    const statusConfig = {
      'in-stock': { label: 'В наличии', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'medium': { label: 'Средний', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'low': { label: 'Низкий', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    const config = statusConfig[status];
    return <Badge className={config.className}><Icon name="AlertCircle" size={14} className="mr-1" />{config.label}</Badge>;
  };

  const exportToExcel = () => {
    const data = materials.map(m => ({
      'ID': m.id,
      'Название': m.name,
      'Описание': m.description,
      'Текущий запас': `${m.currentStock} ${m.unit}`,
      'Минимальный запас': `${m.minStock} ${m.unit}`,
      'Цена': `${m.price} ₽`,
      'Статус': m.status === 'in-stock' ? 'В наличии' : m.status === 'medium' ? 'Средний' : 'Низкий'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Материалы');
    XLSX.writeFile(workbook, `Материалы_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex gap-4 mb-6 items-center">
        <Button 
          onClick={exportToExcel} 
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
  );
}
