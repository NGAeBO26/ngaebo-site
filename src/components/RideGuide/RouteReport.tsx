import { useState, useEffect } from 'react';
import '../../styles/RouteReport.css';

export default function RouteReport({ routeID }: { routeID: string }) {
  const [poiData, setPoiData] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [ssdiData, setSsdiData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [reportDate, setReportDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resPois, resGeo, resSsdi, resWeather] = await Promise.all([
          fetch(`/data/locations/${routeID}_pois.json`).then(r => r.json()),
          fetch(`/data/fs-road-testfeatures-26916.geojson`).then(r => r.json()),
          fetch(`/data/conditions/${routeID}_ssdi.json`).then(r => r.json()),
          fetch(`/data/weather/${routeID}_weather.json`).then(r => r.json())
        ]);
        const feature = resGeo.features.find((f: any) => f.properties.ROUTE_ID === routeID || f.properties.ID === routeID);
        setPoiData(resPois);
        setGeoData(feature?.properties);
        setSsdiData(resSsdi);
        setWeatherData(resWeather);
        setReportDate(new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }));
      } catch (err) {
        console.error("RideGuide CAD Sync Error:", err);
      }
    };
    fetchData();
  }, [routeID]);

  if (!geoData || !ssdiData || !weatherData) {
    return (
      <div className="rr-isolation-shell">
        <div className="rr-loading-status-txt-node">Syncing CAD Dimensions...</div>
      </div>
    );
  }

  const fcsBadge = `/images/badges/fcs/fcs-badge-${geoData?.fcs_final_text?.toLowerCase().replace(' ', '') || 'easy'}.svg`;
  const conditionBadge = `/images/badges/trail-condition/trail-condition-badges-${ssdiData?.badge_type || 'ideal'}.svg`;
  const weatherIcon = `/images/icons/${weatherData.primary_condition === "Sunny" ? "sun_with_face_3d.png" : "sun_behind_small_cloud_3d.png"}`;

  return (
    <div className="rr-isolation-shell">
      <div className="rr-document-page">
        
        {/* ROW 1: HEADER (58mm Locked) */}
        <div className="rr-header-locked-block">
          <div className="rr-header-blue-cap-bleed-node"></div>
          
          <div className="rr-branding-identity-container">
            {/* LEFT: FCS SCORE */}
            <div className="rr-brand-col-60mm rr-left-align-box">
               <div className="rr-score-stack-box-node">
                  <img src={fcsBadge} className="rr-img-fcs-shield-node" alt="FCS" />
                  <div className="rr-score-text-overlay-node">{geoData?.fcs_final_score?.toFixed(1)}</div>
               </div>
            </div>

            {/* CENTER: LOGO + CENTERED SINGLE SUBHEADER + IDENTITY */}
            <div className="rr-brand-col-center-node">
               <div className="rr-logo-anchor-box">
                  <img src="/images/RideGuide_embroid-v1.svg" className="rr-img-logo-main-node" alt="RideGuide" />
               </div>
               
               <div className="rr-brand-subheader-box">
                  <div className="rr-tagline-centered-node">High Accuracy Terrain - Custom Analytics - Weather Aware</div>
               </div>
               
               <div className="rr-route-identity-nest-node">
                  <div className="rr-route-name-header-node">FS {geoData?.ID} - {geoData?.NAME}</div>
                  <div className="rr-route-type-subtitle-node">Route: <span className="rr-text-bold-heavy"> {geoData?.rec_bike_type} </span> | Surface: <span className="rr-text-bold-heavy"> {geoData?.SURFACE_TY} </span></div>
               </div>
            </div>

            {/* RIGHT: NGAeBO + CENTERED QR */}
            <div className="rr-brand-col-60mm rr-right-anchor-box">
               <div className="rr-ngaebo-qr-vertical-stack">
                  <img src="/images/Mountain_Badge_v1.0_small.svg" className="rr-img-ngaebo-side-badge-node" alt="NGAeBO" />
                  <div className="rr-qr-placeholder-centered-box">QR</div>
               </div>
            </div>
          </div>

          {/* WEATHER BAR: ELEVATED Z-INDEX */}
          <div className="rr-weather-floating-row-bar">
             <div className="rr-weather-data-group-node">
               <img src={weatherIcon} className="rr-img-weather-icon-mini-node" alt="W" />
               <span className="rr-weather-val-display-text-node">{weatherData.temp_avg}°F | {weatherData.primary_condition}</span>
             </div>
             <div className="rr-weather-v-divider-pipe-node">|</div>
             <div className="rr-weather-group-txt-node">{weatherData.wind_dir} {weatherData.wind_max} mph</div>
             <div className="rr-weather-v-divider-pipe-node">|</div>
             <div className="rr-weather-group-txt-node">{weatherData.precip_prob}% precip</div>
             <div className="rr-weather-v-divider-pipe-node">|</div>
             <div className="rr-weather-group-txt-node">{weatherData.humidity}% humidity</div>
          </div>
        </div>

        {/* ROW 2: LABELS (9mm) */}
        <div className="rr-section-label-banner-row-node">
          <div className="rr-label-banner-side-fixed-node">ROUTE METRICS</div>
          <div className="rr-label-banner-center-flex-node">ROUTE MAP</div>
          <div className="rr-label-banner-side-fixed-node">ROUTE GUIDE</div>
        </div>

        {/* ROW 3: BODY (85.4mm) */}
        <div className="rr-main-body-content-tier-node">
          <div className="rr-body-col-fixed-60mm-node">
            <div className="rr-sidebar-top-nest-box-node">
              <div className="rr-orange-sidebar-h4-node">TRAIL CONDITIONS</div>
              <div className="rr-cond-summary-row-box-node">
                <img src={conditionBadge} className="rr-img-cond-status-icon-node" alt="C" />
                <div className="rr-cond-status-value-bold-node">{ssdiData?.condition}</div>
              </div>
              <div className="rr-cond-stats-list-container-node">
                <div className="rr-stat-line-item-txt-node">
                  <span className="rr-cond-label-span-node">Surface:</span> <span className="rr-cond-value-span-node">{ssdiData?.condition}</span>
                </div>
                <div className="rr-stat-line-item-txt-node">
                  <span className="rr-cond-label-span-node">Access:</span> <span className="rr-cond-value-span-node">{ssdiData?.access?.label}</span>
                </div>
                <div className="rr-stat-line-item-txt-node">
                  <span className="rr-cond-label-span-node">Ruggedness:</span> <span className="rr-cond-value-span-node">{ssdiData?.ruggedness?.class}</span>
                </div>
                <div className="rr-stat-line-item-txt-node">
                  <span className="rr-cond-label-span-node">Energy Penalty:</span> <span className="rr-cond-value-span-node">{ssdiData?.physics?.energy_penalty_pct}%</span>
                </div>
              </div>
              <div className="rr-metrics-vertical-stack-nest-node">
                <div className="rr-metric-row-item-box-node">
                  <img src="/data/assets/icon_distance.svg" className="rr-img-metric-m-icon-node" alt="D" />
                  <div className="rr-metric-val-lab-stack-node">
                    <div className="rr-metric-num-bold-txt-node">{geoData?.GIS_MILES?.toFixed(1)} mi</div>
                    <div className="rr-metric-lab-small-caps-node">Distance</div>
                  </div>
                </div>
                <div className="rr-metric-row-item-box-node">
                  <img src="/data/assets/icon_gain.svg" className="rr-img-metric-m-icon-node" alt="G" />
                  <div className="rr-metric-val-lab-stack-node">
                    <div className="rr-metric-num-bold-txt-node">{geoData?.elev_gain?.toFixed(0)} ft</div>
                    <div className="rr-metric-lab-small-caps-node">Elevation Gain</div>
                  </div>
                </div>
                <div className="rr-metric-row-item-box-node">
                  <img src="/data/assets/icon_grade.svg" className="rr-img-metric-m-icon-node" alt="Gr" />
                  <div className="rr-metric-val-lab-stack-node">
                    <div className="rr-metric-num-bold-txt-node">{geoData?.grade_max?.toFixed(1)}%</div>
                    <div className="rr-metric-lab-small-caps-node">Max Grade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rr-body-col-center-flex-node">
             <div className="rr-map-viewport-locked-frame-node">
                <img src={`/data/maps/${routeID}_map.png`} className="rr-img-main-report-map-static-node" alt="Map" />
             </div>
          </div>

          <div className="rr-body-col-fixed-60mm-node">
            <div className="rr-sidebar-top-nest-box-node">
              <div className="rr-orange-sidebar-h4-node">PLACES TO SEE</div>
              <div className="rr-poi-items-list-stack-box-node">
                {poiData?.locations?.slice(0, 6).map((poi: any, i: number) => (
                  <div key={i} className="rr-poi-row-item-entry-node">
                    <div className="rr-poi-title-text-bold-node">- {poi.label} <span className="rr-poi-tag-orange-span-node">[{poi.type.toUpperCase()}]</span></div>
                    <div className="rr-poi-via-path-text-node-val">via {poi.via}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: ANCHORS (60mm) */}
        <div className="rr-transition-anchor-tier-locked-node">
           <div className="rr-anchor-cell-fixed-60mm-node">
              <div className="rr-orange-sidebar-h4-node">ROUTE SCORES</div>
              <img src={`/data/visualization/${routeID}_spider.svg`} className="rr-img-spider-graph-render-svg-node" alt="S" />
           </div>
           <div className="rr-anchor-cell-center-flex-node"></div>
           <div className="rr-anchor-cell-fixed-60mm-node">
              <div className="rr-orange-sidebar-h4-node">LEGEND</div>
              <img src="/data/assets/rideguide-legend.svg" className="rr-img-legend-graphics-static-node" alt="L" />
           </div>
        </div>

        {/* ROW 5: FOOTER (67mm) */}
        <div className="rr-footer-block-locked-tier-node">
          <div className="rr-elev-profile-label-banner-node">ELEVATION PROFILE</div>
          <div className="rr-sparkline-canvas-render-box-node">
             <img src={`/data/sparklines/${routeID}_sparkline.svg`} className="rr-img-sparkline-locked-render-node" style={{ objectFit: 'fill' }} alt="E" />
          </div>
          <div className="rr-branded-blue-footer-info-bar-node">
             <a href="mailto:jeff@northgeorgiaebikes.com" className="rr-footer-nav-link-item-node">jeff@northgeorgiaebikes.com</a>
             <div className="rr-footer-v-divider-pipe-node">|</div>
             <a href="https://www.northgeorgiaebikes.com" target="_blank" rel="noreferrer" className="rr-footer-nav-link-item-node">www.northgeorgiaebikes.com</a>
             <div className="rr-footer-v-divider-pipe-node">|</div>
             <div className="rr-footer-timestamp-display-node">Report Created: {reportDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}