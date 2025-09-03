import { useState, useCallback, useMemo } from 'react';
import { notification } from 'antd';

interface BulkActionsConfig {
  onStatusChange?: (ids: React.Key[], status: string) => Promise<void>;
  onDelete?: (ids: React.Key[]) => Promise<void>;
  onExport?: (ids: React.Key[]) => Promise<void>;
}

export const useBulkActions = (config: BulkActionsConfig) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  const selectAll = useCallback((allKeys: React.Key[]) => {
    setSelectedRowKeys(allKeys);
  }, []);

  const toggleSelection = useCallback((key: React.Key) => {
    setSelectedRowKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  }, []);

  const bulkChangeStatus = useCallback(async (status: string) => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: 'Peringatan',
        description: 'Pilih data terlebih dahulu',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await config.onStatusChange?.(selectedRowKeys, status);
      notification.success({
        message: 'Berhasil',
        description: `${selectedRowKeys.length} data berhasil diubah statusnya`,
      });
      clearSelection();
    } catch (error) {
      notification.error({
        message: 'Gagal',
        description: 'Terjadi kesalahan saat mengubah status',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRowKeys, config.onStatusChange, clearSelection]);

  const bulkDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: 'Peringatan',
        description: 'Pilih data terlebih dahulu',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await config.onDelete?.(selectedRowKeys);
      notification.success({
        message: 'Berhasil',
        description: `${selectedRowKeys.length} data berhasil dihapus`,
      });
      clearSelection();
    } catch (error) {
      notification.error({
        message: 'Gagal',
        description: 'Terjadi kesalahan saat menghapus data',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRowKeys, config.onDelete, clearSelection]);

  const bulkExport = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: 'Peringatan',
        description: 'Pilih data terlebih dahulu',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await config.onExport?.(selectedRowKeys);
      notification.success({
        message: 'Berhasil',
        description: `${selectedRowKeys.length} data berhasil diekspor`,
      });
    } catch (error) {
      notification.error({
        message: 'Gagal',
        description: 'Terjadi kesalahan saat mengekspor data',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRowKeys, config.onExport]);

  const selectionInfo = useMemo(() => ({
    count: selectedRowKeys.length,
    hasSelection: selectedRowKeys.length > 0,
    isProcessing,
  }), [selectedRowKeys.length, isProcessing]);

  const rowSelection = useMemo(() => ({
    type: 'checkbox' as const,
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    onSelectAll: (selected: boolean, _selectedRows: any[], changeRows: any[]) => {
      if (selected) {
        const newKeys = changeRows.map(row => row.id);
        setSelectedRowKeys(prev => [...prev, ...newKeys]);
      } else {
        const removedKeys = changeRows.map(row => row.id);
        setSelectedRowKeys(prev => prev.filter(key => !removedKeys.includes(key)));
      }
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.status === 'LULUS KEGIATAN' || isProcessing,
    }),
    preserveSelectedRowKeys: true,
  }), [selectedRowKeys, isProcessing]);

  return {
    selectedRowKeys,
    setSelectedRowKeys,
    clearSelection,
    selectAll,
    toggleSelection,
    bulkChangeStatus,
    bulkDelete,
    bulkExport,
    selectionInfo,
    rowSelection,
  };
};
