import { useState, useCallback, useMemo } from "react";
import { notification, message } from "antd";

interface BulkActionsConfig {
  onStatusChange?: (ids: React.Key[], status: string) => Promise<void>;
  onDelete?: (ids: React.Key[]) => Promise<void>;
  onExport?: (ids: React.Key[]) => Promise<void>;
}

export const useBulkActions = ({
  onStatusChange,
  onDelete,
  onExport,
}: BulkActionsConfig) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  const selectAll = useCallback((allKeys: React.Key[]) => {
    setSelectedRowKeys(allKeys);
  }, []);

  const toggleSelection = useCallback((key: React.Key) => {
    setSelectedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const bulkChangeStatus = useCallback(
    async (status: string) => {
      if (selectedRowKeys.length === 0) {
        notification.warning({
          title: "Peringatan",
          description: "Pilih data terlebih dahulu",
        });
        return;
      }

      setIsProcessing(true);
      try {
        await onStatusChange?.(selectedRowKeys, status);
        message.success(
          `${selectedRowKeys.length} data berhasil diubah statusnya`,
        );
        clearSelection();
      } catch {
        notification.error({
          title: "Gagal",
          description: "Terjadi kesalahan saat mengubah status",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedRowKeys, onStatusChange, clearSelection],
  );

  const bulkDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        title: "Peringatan",
        description: "Pilih data terlebih dahulu",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onDelete?.(selectedRowKeys);
      message.success(`${selectedRowKeys.length} data berhasil dihapus`);
      clearSelection();
    } catch {
      notification.error({
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus data",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRowKeys, onDelete, clearSelection]);

  const bulkExport = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        title: "Peringatan",
        description: "Pilih data terlebih dahulu",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onExport?.(selectedRowKeys);
      message.success(`${selectedRowKeys.length} data berhasil diekspor`);
    } catch {
      notification.error({
        title: "Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRowKeys, onExport]);

  const selectionInfo = useMemo(
    () => ({
      count: selectedRowKeys.length,
      hasSelection: selectedRowKeys.length > 0,
      isProcessing,
    }),
    [selectedRowKeys.length, isProcessing],
  );

  const rowSelection = useMemo(
    () => ({
      type: "checkbox" as const,
      selectedRowKeys,
      onChange: setSelectedRowKeys,
      onSelectAll: (
        selected: boolean,
        _selectedRows: { id: React.Key }[],
        changeRows: { id: React.Key }[],
      ) => {
        if (selected) {
          const newKeys = changeRows.map((row) => row.id);
          setSelectedRowKeys((prev) => [...prev, ...newKeys]);
        } else {
          const removedKeys = changeRows.map((row) => row.id);
          setSelectedRowKeys((prev) =>
            prev.filter((key) => !removedKeys.includes(key)),
          );
        }
      },
      getCheckboxProps: (record: { status?: string }) => ({
        disabled: record.status === "LULUS KEGIATAN" || isProcessing,
      }),
      preserveSelectedRowKeys: true,
    }),
    [selectedRowKeys, isProcessing],
  );

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
