'use client';

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { isManagedUploadPath, resolveUploadedFileUrl } from '@/lib/upload-path';
import { MAP_ZOOM_CITY, MAP_ZOOM_DISTRICT, MAP_ZOOM_PROVINCE, MUNICIPALITY_PROVINCES } from '@/utils/constants';
import type { MapPickResult } from '@/components/BaiduMapPicker';
import areaData from '@/localData/area.json';
import subwaysData from '@/localData/subways_city.json';

export type CommunityFormData = {
  name: string;
  province: string;
  city: string;
  district: string;
  street: string;
  streetNumber: string;
  subwayLine: string;
  lng: string;
  lat: string;
  cover: string;
};

export type CoverUploadApi = {
  upload: (file: File) => Promise<string>;
  remove: (path: string) => Promise<void>;
};

const DEFAULT_FORM: CommunityFormData = {
  name: '', province: '', city: '', district: '',
  street: '', streetNumber: '', subwayLine: '', lng: '', lat: '', cover: '',
};

type AreaOption = { label: string; value: string };

export function useCommunityForm({
  initialData,
  autoFillProvince,
  autoFillCity,
  coverApi,
  onSubmit,
}: {
  initialData?: Partial<CommunityFormData>;
  autoFillProvince?: () => string;
  autoFillCity?: () => string;
  coverApi: CoverUploadApi;
  onSubmit: (data: CommunityFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<CommunityFormData>({ ...DEFAULT_FORM, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof CommunityFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaningCover, setIsCleaningCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const initialCoverRef = useRef(initialData?.cover ?? '');

  /* Auto-fill province & city from localStorage (create mode only) */
  useEffect(() => {
    if (initialData?.province || initialData?.city) return;
    const province = autoFillProvince?.() ?? '';
    const city = autoFillCity?.() ?? '';
    if (!province || !city) return;
    const cityValue = MUNICIPALITY_PROVINCES.has(province) ? '市辖区' : city;
    setForm((f) => ({ ...f, province, city: cityValue }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sync initial data on mount (edit mode) */
  useEffect(() => {
    if (!initialData) return;
    setForm({ ...DEFAULT_FORM, ...initialData });
    initialCoverRef.current = initialData.cover ?? '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Area cascade */
  const provinces = useMemo<AreaOption[]>(
    () => (areaData as any[]).map((p) => ({ label: String(p.label), value: String(p.value) })),
    []
  );
  const cities = useMemo<AreaOption[]>(() => {
    if (!form.province) return [];
    const province = (areaData as any[]).find((p) => p.value === form.province);
    return province?.children?.map((c: any) => ({ label: String(c.label), value: String(c.value) })) ?? [];
  }, [form.province]);
  const districts = useMemo<AreaOption[]>(() => {
    if (!form.province || !form.city) return [];
    const province = (areaData as any[]).find((p) => p.value === form.province);
    const city = province?.children?.find((c: any) => c.value === form.city);
    return city?.children?.map((d: any) => ({ label: String(d.label), value: String(d.value) })) ?? [];
  }, [form.province, form.city]);

  /* Subway lines */
  const subwayLines = useMemo<string[]>(() => {
    if (!form.subwayLine) return [];
    try {
      const arr = JSON.parse(form.subwayLine);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }, [form.subwayLine]);

  const availableSubwayLines = useMemo<string[]>(() => {
    if (!form.city) return [];
    const cityName = form.city === '市辖区' ? form.province : form.city;
    const entry = (subwaysData as { name: string; lines: string[] }[]).find((s) => s.name === cityName);
    return entry?.lines ?? [];
  }, [form.city, form.province]);

  const toggleSubwayLine = (line: string) => {
    const next = subwayLines.includes(line)
      ? subwayLines.filter((l) => l !== line)
      : [...subwayLines, line];
    setForm((f) => ({ ...f, subwayLine: next.length ? JSON.stringify(next) : '' }));
  };

  /* Address query for forward geocoding */
  const addressQuery = useMemo(
    () => [form.province, form.city, form.district, form.street, form.streetNumber].filter(Boolean).join(''),
    [form.province, form.city, form.district, form.street, form.streetNumber]
  );

  /* Map */
  // Computed once at mount for the map's initial center city
  const centerCityRef = useRef<string | undefined>(
    (!initialData?.lng && !initialData?.lat) ? autoFillCity?.() : undefined
  );
  const centerCity = centerCityRef.current;

  const mapZoom = useMemo(() => {
    if (form.district) return MAP_ZOOM_DISTRICT;
    if (form.city) return MAP_ZOOM_CITY;
    if (form.province) return MAP_ZOOM_PROVINCE;
    return MAP_ZOOM_CITY;
  }, [form.province, form.city, form.district]);

  const mapPosition = useMemo(() => {
    const lng = parseFloat(form.lng);
    const lat = parseFloat(form.lat);
    if (isNaN(lng) || isNaN(lat)) return undefined;
    return { lng, lat };
  }, [form.lng, form.lat]);

  const handleMapPick = (result: MapPickResult) => {
    setForm((f) => ({
      ...f,
      lng: String(result.lng),
      lat: String(result.lat),
      province: result.province || f.province,
      city: result.city || f.city,
      district: result.district || f.district,
      street: result.street || f.street,
      streetNumber: result.streetNumber || f.streetNumber,
    }));
    setErrors((e) => ({ ...e, province: undefined, city: undefined, district: undefined, lng: undefined, lat: undefined }));
  };

  /* Cover upload */
  const coverPreviewUrl = resolveUploadedFileUrl(form.cover.trim());

  const cleanupTransient = async (path: string, preserved?: string) => {
    const norm = path.trim();
    const initial = initialCoverRef.current.trim();
    if (!norm || !isManagedUploadPath(norm)) return;
    if (norm === initial) return;
    if (preserved && norm === preserved) return;
    try { await coverApi.remove(norm); } catch (e) { console.error(e); }
  };

  const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const prevCover = form.cover.trim();
    setUploadError('');
    setIsUploading(true);
    try {
      const path = await coverApi.upload(file);
      await cleanupTransient(prevCover, path);
      setForm((f) => ({ ...f, cover: path }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '封面上传失败');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleClearCover = async () => {
    setIsCleaningCover(true);
    try {
      await cleanupTransient(form.cover.trim());
      setForm((f) => ({ ...f, cover: '' }));
    } finally {
      setIsCleaningCover(false);
    }
  };

  /* Validation */
  const validate = () => {
    const e: Partial<Record<keyof CommunityFormData, string>> = {};
    if (!form.name.trim()) e.name = '小区名称不能为空';
    if (!form.province) e.province = '请选择省份';
    if (!form.city) e.city = '请选择城市';
    if (!form.district) e.district = '请选择区/县';
    if (!form.lng || isNaN(Number(form.lng))) e.lng = '请输入有效经度';
    if (!form.lat || isNaN(Number(form.lat))) e.lat = '请输入有效纬度';
    if (!form.cover.trim()) e.cover = '请上传封面图片';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* Reset (create mode only) */
  const handleReset = () => {
    const province = autoFillProvince?.() ?? '';
    const city = autoFillCity?.() ?? '';
    const cityValue = MUNICIPALITY_PROVINCES.has(province) ? '市辖区' : city;
    setForm({ ...DEFAULT_FORM, province, city: cityValue });
    setErrors({});
    setUploadError('');
  };

  /* Submit */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isUploading || isCleaningCover;

  return {
    form, setForm,
    errors,
    provinces, cities, districts,
    subwayLines, availableSubwayLines, toggleSubwayLine,
    addressQuery, centerCity, mapZoom, mapPosition,
    handleMapPick,
    coverPreviewUrl, isUploading, isCleaningCover, uploadError,
    handleCoverUpload, handleClearCover,
    isSubmitting, busy,
    handleSubmit, handleReset,
  };
}
