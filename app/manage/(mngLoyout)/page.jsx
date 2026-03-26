'use client';
import React, { useEffect } from 'react';

export default function MngPage() {
  useEffect(() => {
    console.log('MngPage', MngPage);
  }, []);
  return <div>Management Home Page</div>;
}
