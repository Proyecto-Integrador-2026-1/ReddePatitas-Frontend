// src/components/ui/MapFilters.tsx
import React from 'react';
import { Button } from './Button';

interface MapFiltersProps {
  filters: {
    estado: 'todos' | 'perdido' | 'encontrado';
    tipo: 'todos' | 'perro' | 'gato' | 'otro';
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

// 👇 Asegúrate de que sea export function, no solo function
export function MapFilters({ filters, onFilterChange, onClearFilters }: MapFiltersProps) {
  const hasActiveFilters = filters.estado !== 'todos' || filters.tipo !== 'todos';

  return (
    <div className="bg-white rounded-xl shadow-md p-3 flex flex-wrap gap-3 items-center justify-between">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtro por estado */}
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-600 self-center">Estado:</span>
          <Button
            variant={filters.estado === 'todos' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('estado', 'todos')}
          >
            Todos
          </Button>
          <Button
            variant={filters.estado === 'perdido' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('estado', 'perdido')}
          >
            Perdidos
          </Button>
          <Button
            variant={filters.estado === 'encontrado' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('estado', 'encontrado')}
          >
            Encontrados
          </Button>
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-gray-300 hidden sm:block" />

        {/* Filtro por tipo */}
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-600 self-center">Tipo:</span>
          <Button
            variant={filters.tipo === 'todos' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('tipo', 'todos')}
          >
            Todos
          </Button>
          <Button
            variant={filters.tipo === 'perro' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('tipo', 'perro')}
          >
            Perros
          </Button>
          <Button
            variant={filters.tipo === 'gato' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('tipo', 'gato')}
          >
            Gatos
          </Button>
          <Button
            variant={filters.tipo === 'otro' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('tipo', 'otro')}
          >
            Otros
          </Button>
        </div>
      </div>

      {/* Botón limpiar - solo visible si hay filtros activos */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}