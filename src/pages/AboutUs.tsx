/* src/pages/AboutUs.tsx */
import TacticalLeadForm from "../components/TacticalLeadForm";
import "../styles/AboutUs.css";

export default function AboutUs() {
  return (
    /* ─── 🎯 FIX 1: SWAPPED DIV TO MAIN LANDMARK REGION ─── 
       Ensures that the entire page's informational structure is fully contained within a valid landmark boundary. */
    <div className="about-us-funnel-container-shell" style={{ width: "100%", display: "block" }}>
      
      {/* SYSTEM CORE INJECTOR ─── */}
      <div className="about-us-workspace-funnel" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        
        {/* ─── HERO INTRO SECTION (Floating Card A) ─── */}
        {/* ─── 🎯 FIX 2: NAMED LANDMARK REGION LINKED TO ID ─── */}
        <section 
          className="about-section-floating-card" 
          style={{ marginTop: "60px" }}
          aria-labelledby="about-main-headline"
        >
          <div className="about-hero-headline-block">
            <h1 id="about-main-headline">Driven by Data. Built for the Backcountry.</h1>
            <p className="about-intro-p">
              Hey there, and welcome to <strong>North Georgia eBike Outfitters</strong>. 
              If you're anything like me, you can't stand being cooped up inside for too long. 
              I built this passion project because I love the absolute freedom of an all-terrain eBike, 
              but I quickly realized that generic trail apps just don't cut it when you are deep in the trees. 
              The backcountry doesn't care about cell reception, and standard maps don't understand 
              topography, slope thresholds, or eBike power management. To really explore off the beaten path, 
              you need data you can actually trust. That's where I come in.
            </p>
          </div>

          {/* Inline Media Showcase Grid */}
          <div className="about-split-media-deck" style={{ display: "flex", gap: "20px", marginTop: "32px", flexWrap: "wrap" }}>
            <div className="about-media-frame" style={{ flex: "1", minWidth: "280px" }}>
              <img 
                src="/images/gallery/toccoa_bridge1.jpg" 
                alt="Scenic view over calm lake with docks and pine trees" 
                className="about-scenic-img-asset" 
              />
              <span className="about-image-caption">Scouting quiet vantage points across the water</span>
            </div>
            <div className="about-media-frame" style={{ flex: "1", minWidth: "280px" }}>
              <img 
                src="/images/gallery/waterfall_pool1.jpg" 
                alt="Pristine hidden waterfall dropping into a shallow rocky pool" 
                className="about-scenic-img-asset" 
              />
              <span className="about-image-caption">Locating hidden waterfall runs tucked deep in the summer gaps</span>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: THE IMMERSIVE OUTDOORS GALLERY PANEL (Floating Card B) ─── */}
        {/* ─── 🎯 FIX 3: NAMED LANDMARK REGION LINKED TO ID ─── */}
        <section className="about-section-floating-card" aria-labelledby="about-gallery-headline">
          <div className="about-text-content-header" style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 id="about-gallery-headline">A Lifetime of Chasing Horizons</h2>
            <p style={{ color: "var(--brand-bone)", maxWidth: "800px", margin: "12px auto 0 auto", lineHeight: 1.6 }}>
              My love for travel and the great outdoors isn't just a weekend hobby—it's been my entire life's anchor. 
              From tracking arid desert blooms to paddling deep southern swamps, I've spent decades documenting 
              the natural world.
            </p>
          </div>

          {/* Asymmetrical Floating Interaction Card Matrix Layout */}
          <div className="about-tabletop-cards-grid">
            
            <div className="about-travel-card-frame card-rotation-neg">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/cali1.jpg" alt="Coastal paths and blue ocean horizons" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Coastal Horizons</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-pos-mid">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/cali_cactus1.jpg" alt="Flowering prickly pear cactus bloom" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Desert Flora</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-pos-high">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/gator1.jpg" alt="Large alligator sunning on a cypress log" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Wetland Wildlife</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-neg-mid">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/swamp1.jpg" alt="Sunbeams cutting through Spanish moss in a cypress swamp" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Swamp Canopy</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-pos-mid">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/india1.jpg" alt="Vibrant hanging market flower garlands" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Global Culture</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-pos-mid">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/falconry1.jpg" alt="Jeff holding a hooded falcon on a leather glove" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Field Falconry</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-neg-high">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/river_gorge1.jpg" alt="Looking down into the gorge" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Nature's Wonder</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-pos-mid">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/colorado3.jpg" alt="Lake View of with Rocky Mountain Backdrop" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Frontier Fields</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-pos-high">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/sante_fe2.jpg" alt="Golden colors of Sunset" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Golden Hour</span></div>
            </div>

            <div className="about-travel-card-frame card-rotation-neg-high">
              <div className="about-thumbnail-box">
                <img src="/images/gallery/japan3.jpg" alt="Japanese trail shrine" className="about-thumbnail-img" />
              </div>
              <div className="about-card-label"><span>Greatful Reminders</span></div>
            </div>

          </div>
        </section>

        {/* ─── SECTION 3: THE PROFESSIONAL PEDIGREE (Floating Split Grid Card C) ─── */}
        {/* ─── 🎯 FIX 4: NAMED LANDMARK REGION LINKED TO ID ─── */}
        <section className="about-section-split-grid" aria-labelledby="about-pedigree-headline">
          <div className="about-problem-block">
            <h2 id="about-pedigree-headline">The Mapping Guy: My 25-Year Day Job</h2>
            <p className="about-technical-bio-p">
              When I’m not out riding or traveling, I’m a total map geek. I hold a <strong>B.S. in Computer Information Systems from the University of South Alabama</strong>, and I’ve spent the last <strong>25 years</strong> working deeply with spatial data and Geographical Information Systems (GIS).
            </p>
            <p className="about-technical-bio-p" style={{ marginTop: "16px" }}>
              My background involves designing workflows and leading engineering teams for massive countywide LiDAR and FEMA Flood Insurance Rate Map production cycles. For over 15 years, a massive part of my career has been dedicated to supporting the <strong>Federal Emergency Management Agency (FEMA)</strong> and its National Flood Insurance Program, protecting natural environments.
            </p>
          </div>
          <div className="about-solution-block">
            <span className="about-green-tagline">Federal-Grade Spatial Precision</span>
            <p className="about-narrative-p">
              I've dedicated my career to protecting our natural beauty, spending decades modeling complex environments, assessing terrain risks, and mapping out remote river corridors and mountain valleys. 
            </p>
            <blockquote className="about-philosophy-quote">
              "I strive to combine my technical knowledge and communication skills to integrate spatial datasets with user friendly design to promote risk awareness and communication in the communities I serve."
            </blockquote>
          </div>
        </section>

        {/* ─── SECTION 4: BOTANY & CREEK BED DETAIL (Floating Card D) ─── */}
        {/* ─── 🎯 FIX 5: INJECT DIRECT STRING ATTRIBUTE FOR HEADERLESS SECTIONS ─── */}
        <section className="about-section-floating-card" aria-label="Field Scouting and Botany Imagery Grid">
          <div className="about-split-media-deck" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div className="about-media-frame" style={{ flex: "1.5", minWidth: "280px" }}>
              <img 
                src="/images/gallery/stream1.jpg" 
                alt="Rocky creek bed with flowing water and shaded canopy trees" 
                className="about-scenic-img-asset" 
              />
              <span className="about-image-caption">Analyzing high-resolution terrain models means understanding the rocks and channels firsthand</span>
            </div>
            <div className="about-media-frame" style={{ flex: "1", minWidth: "280px" }}>
              <img 
                src="/images/gallery/rhody1.jpg" 
                alt="Delicate pink and white mountain rhododendron blooms" 
                className="about-scenic-img-asset" 
              />
              <span className="about-image-caption">Native mountain rhododendrons lining our local ridge tracks</span>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: WHERE DATA MEETS DIRT (Floating Card E) ─── */}
        {/* ─── 🎯 FIX 6: NAMED LANDMARK REGION LINKED TO ID ─── */}
        <section 
          className="about-section-floating-card" 
          style={{ marginBottom: "60px" }}
          aria-labelledby="about-dirt-headline"
        >
          <div className="about-split-media-deck" style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
            
            <div style={{ flex: "1", minWidth: "300px" }}>
              <img 
                src="/images/gallery/ft_mtn1.jpg" 
                alt="High vantage view through pine needles looking out over green horizons" 
                className="about-scenic-img-asset" 
                style={{ borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }}
              />
            </div>

            <div style={{ flex: "1.2", minWidth: "300px" }}>
              <h2 id="about-dirt-headline">Where Data Meets Dirt</h2>
              <p style={{ color: "var(--brand-bone)", fontSize: "1.05rem", lineHeight: 1.6, margin: "16px 0 0 0" }}>
                That’s the exact philosophy behind our <strong>RideFinder Pro</strong> platform and the printable <strong>RideGuides</strong> we’ve been working on. I didn't just copy-paste some generic trail lines from a public forum. I took that same federal-grade spatial precision I use in my day job and applied it directly to our backcountry bike routes.
              </p>
              <p style={{ color: "var(--brand-bone)", fontSize: "1.05rem", lineHeight: 1.6, marginTop: "12px" }}>
                When we map out a Fire Service road or a rugged mountain ridge track, we calculate the precise elevation metrics, grade percentages, and terrain profiles. That way, you know <em>exactly</em> what you're up against before you even turn the pedals. It helps you manage your eBike's battery life perfectly, protects your knees, and lets you ride with absolute peace of mind.
              </p>
              <p style={{ color: "var(--brand-amber, #d88a3a)", fontSize: "1.1rem", fontWeight: 700, marginTop: "20px", fontFamily: "'Montserrat', sans-serif" }}>
                I love these trails, I love the data behind them, and I’m incredibly glad to share them with you. Dial in your filters, grab your RideGuide and your gear, and I'll see you on the trail!
              </p>
            </div>

          </div>
        </section>

        {/* ─── SECTION 6: FULL-WIDTH NESTLED FOOTER SAFETY NET ─── */}
        {/* ─── 🎯 FIX 7: NAMED LANDMARK REGION LINKED TO ID ─── */}
        <section 
          className="lead-capture-footer-about"
          aria-labelledby="about-footer-headline"
          style={{
            width: "calc(100% + 40px)",
            marginLeft: "-20px",
            marginRight: "-20px",
            marginBottom: "-100px",
            backgroundColor: "color-mix(in srgb, var(--brand-deep-green) 92%, #000000)",
            padding: "48px 40px",
            boxSizing: "border-box",
            display: "block"
          }}
        >
          <div className="about-funnel-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="about-capture-split-layout" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px", flexWrap: "wrap" }}>
              
              <div className="about-capture-text-stack" style={{ flex: "1", minWidth: "280px", textAlign: "left" }}>
                <h3 id="about-footer-headline" style={{ margin: "0 0 8px 0", fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#ffffff" }}>
                  Stay Up to Date.
                </h3>
                <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Stay ready for your next ride. Get the latest on deals, events, and new products. Delivered straight to your inbox.
                </p>
              </div>

              <div style={{ minWidth: "320px" }}>
                <TacticalLeadForm 
                  buttonLabel="Sign Up" /* Clean label text handles screen readers seamlessly */
                  sourceGroupTag="about_page_newsletter"
                  layout="row"
                />
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}