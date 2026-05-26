import React, { useState } from 'react';
import { Upload, Button, Input, Table, Space, Checkbox, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from '@/utils/axios';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const BulkUploadImagesPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [mappingCSV, setMappingCSV] = useState('');
  const [autoMatchByFilename, setAutoMatchByFilename] = useState(true);
  const [loading, setLoading] = useState(false);

  const columns = [
    { title: 'File name', dataIndex: 'name', key: 'name' },
    { title: 'Size', dataIndex: 'size', key: 'size', render: (s: any) => `${Math.round((s || 0) / 1024)} KB` },
    { title: 'Document ID', dataIndex: 'document_id', key: 'document_id', render: (_: any, row: any) => (
      <Input defaultValue={row.document_id} onChange={(e) => { row.document_id = e.target.value; }} />
    ) },
  ];

  const handleChange = ({ fileList: fList }: { fileList: UploadFile[] }) => {
    setFileList(fList.map((f) => ({ ...f })));
  };

  const parseCSVToMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    const lines = mappingCSV.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const [filename, docId] = parts;
        map[filename] = docId;
      }
    }
    return map;
  };

  const toDataURI = (file: UploadFile): Promise<string> => new Promise((resolve, reject) => {
    if (!file.originFileObj) return reject(new Error('No origin file'));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file.originFileObj as Blob);
  });

  const handleUpload = async () => {
    if (!fileList.length) { message.warning('Chưa chọn file nào'); return; }
    setLoading(true);
    try {
      const csvMap = parseCSVToMap();
      const payload: any[] = [];
      for (const f of fileList) {
        const filename = f.name || '';
        let docId = (f as any).document_id || '';
        if (!docId && autoMatchByFilename) {
          // try to match by filename (without extension)
          const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
          docId = csvMap[filename] || csvMap[nameWithoutExt] || '';
        }
        if (!docId) {
          message.warn(`Bỏ qua ${filename}: chưa có document_id`);
          continue;
        }
        const dataUri = await toDataURI(f);
        payload.push({ document_id: docId, cover_image: dataUri });
      }

      if (!payload.length) { message.error('Không có ảnh hợp lệ để upload'); setLoading(false); return; }

      const resp = await axios.post('/api/v1/documents/bulk/upload-images', payload);
      message.success(`Upload xong: thành công ${resp.data.success}, lỗi ${resp.data.failed}`);
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi upload: ' + (err?.message || err?.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Bulk Upload Cover Images</h2>
      <p>Chọn nhiều ảnh, nhập mapping filename → document_id (CSV) hoặc bật tự dò theo tên file.</p>

      <Upload multiple beforeUpload={() => false} fileList={fileList} onChange={handleChange}>
        <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
      </Upload>

      <Space style={{ marginTop: 12 }}>
        <Checkbox checked={autoMatchByFilename} onChange={(e) => setAutoMatchByFilename(e.target.checked)}>Tự dò theo tên file</Checkbox>
        <Button type="primary" onClick={handleUpload} loading={loading}>Upload</Button>
      </Space>

      <div style={{ marginTop: 20 }}>
        <h4>Mapping CSV (filename,document_id) mỗi dòng 1 mục</h4>
        <TextArea rows={6} value={mappingCSV} onChange={(e) => setMappingCSV(e.target.value)} placeholder="book1.jpg,507f1f77bcf86cd799439011" />
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Danh sách file</h4>
        <Table rowKey={(r: any) => r.uid} dataSource={fileList} columns={columns} pagination={false} />
      </div>
    </div>
  );
};

export default BulkUploadImagesPage;
