import * as React from 'react';
import './styles.css';
import ColorHash from 'color-hash';
import lightness from 'lightness';

const ch = new ColorHash();

export default function LinkDetail() {
  const themeColor = ch.hex("Foo");
  const darkThemeColor = lightness(themeColor, -10);

  return <div className="link-detail" style={{backgroundColor: themeColor}}>
    <div className="link-detail-header">
      <h1>Foo</h1>
      <span className="link-detail-delete">Delete</span>
    </div>
    <div className="link-detail-repository to">
      <span className="link-detail-owner">1egoman</span>
      <span className="link-detail-name">biome</span>
      <span className="link-detail-branch">branch</span>
      <span className="link-detail-edit">Edit</span>
    </div>
    <div className="link-detail-repository from">
      <span className="link-detail-owner">1egoman</span>
      <span className="link-detail-name">biome</span>
      <span className="link-detail-branch">branch</span>
      <span className="link-detail-edit">Edit</span>
    </div>
    <div className="link-detail-footer" style={{backgroundColor: darkThemeColor}}>
      <span className="link-detail-submit">Save</span>
    </div>
  </div>;
}
