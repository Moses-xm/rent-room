'use client';
import React, { useState } from 'react';
import styles from './index.module.scss';
import { CaretDownOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import AreaSimple from '@/localData/areaSimple.json';
import Hotcities from '@/localData/hotcities.json';
import AreaAll from '@/localData/area.json';
import { DefaultCity } from '@/utils/constants';

export default function CityPicker() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const curCity =
    typeof window !== 'undefined'
      ? localStorage.getItem('curCity') || DefaultCity
      : DefaultCity;

  const showMoreCity = () => {
    setIsModalVisible(true);
  };

  const handleCityChange = (city) => {
    localStorage.setItem('curCity', city);
    // 切换城市后，强制页面刷新
    location.reload();
  };

  const CiytItem = ({ title, cities }) => {
    return (
      <div className={styles.city_item}>
        <div className={styles.left_title}>{title}</div>
        <div className={styles.right_cities}>
          {cities.map((item) => {
            return (
              <span
                key={item.name}
                onClick={() => handleCityChange(item.name)}
                className={styles.city_item_name}
              >
                {item.name}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const CiytAllItem = ({ province, cities }) => {
    return (
      <div className={styles.all_city_item}>
        <div className={styles.all_left_title}>{province}: </div>
        <div className={styles.all_right_cities}>
          {cities.map((item) => {
            return (
              <span
                key={item.value}
                onClick={() => handleCityChange(item.value)}
                className={styles.all_city_item_name}
              >
                {item.value}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.cityPicker}>
      <div className={styles.city}>
        <span className={styles.city_name}>{curCity}</span>
        <CaretDownOutlined
          style={{ color: '#666', fontSize: '11px', marginLeft: 5 }}
        />
        <div className={styles.city_box}>
          {AreaSimple.map((item) => {
            return (
              <CiytItem
                key={item.name}
                title={item.name}
                cities={item.children}
              />
            );
          })}
          <a className={styles.more_city} onClick={showMoreCity}>
            更多城市&gt;
          </a>
        </div>
      </div>
      <Modal
        title="更多城市"
        open={isModalVisible}
        footer={null}
        width={1000}
        onCancel={() => {
          setIsModalVisible(false);
        }}
      >
        <div className={styles.hot_city}>
          <span className={styles.hot_city_title}>热门城市: </span>
          {Hotcities.map((item) => {
            return (
              <span
                className={styles.hot_city_name}
                key={item.name}
                onClick={() => handleCityChange(item.name)}
              >
                {item.name}
              </span>
            );
          })}
        </div>
        <div className={styles.all_city}>
          <div className={styles.all_city_title}>所有城市：</div>
          {AreaAll.map((item) => {
            return (
              <CiytAllItem
                key={item.value}
                province={item.value}
                cities={item.children}
              />
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
