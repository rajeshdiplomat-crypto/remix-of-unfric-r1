{
  /* Step 1: Emotion Selection */
}
{
  step === 1 && (
    <div className="flex-1 flex flex-col p-4 md:p-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Bar: Icons + Search */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-muted/60 border border-border/40 flex items-center justify-center hover:bg-muted transition-all duration-300 hover:scale-105">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-muted/60 border border-border/40 flex items-center justify-center hover:bg-muted transition-all duration-300 hover:scale-105">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search emotions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-full bg-muted/40 border-border/30 text-sm focus:ring-2 focus:ring-primary/30 transition-all duration-300"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.map((item) => (
                <button
                  key={item.emotion}
                  onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm hover:bg-muted/80 flex items-center gap-3 transition-all duration-200 hover:translate-x-1"
                >
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: QUADRANTS[item.quadrant].color }}
                  />
                  <span className="font-medium">{item.emotion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compact Dark Slider Panel */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 mb-6 border border-slate-700/50 shadow-2xl animate-in slide-in-from-top-4 duration-500">
        <div className="grid grid-cols-2 gap-6">
          {/* Energy Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Low</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-sm font-semibold text-white">Energy</span>
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">High</span>
            </div>
            <div className="relative">
              <Slider
                value={[energy]}
                onValueChange={(v) => handleSliderChange("energy", v[0])}
                max={100}
                step={1}
                className="[&>span:first-child]:h-3 [&>span:first-child]:bg-slate-700 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-gradient-to-br [&_[role=slider]]:from-amber-400 [&_[role=slider]]:to-orange-500 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg [&_[role=slider]]:transition-transform [&_[role=slider]]:duration-200 [&_[role=slider]]:hover:scale-110"
              />
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 pointer-events-none"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>

          {/* Pleasantness Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">−</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Pleasant</span>
              </div>
              <span className="text-xs text-slate-400 font-bold">+</span>
            </div>
            <div className="relative">
              <Slider
                value={[pleasantness]}
                onValueChange={(v) => handleSliderChange("pleasantness", v[0])}
                max={100}
                step={1}
                className="[&>span:first-child]:h-3 [&>span:first-child]:bg-slate-700 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-gradient-to-br [&_[role=slider]]:from-emerald-400 [&_[role=slider]]:to-teal-500 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg [&_[role=slider]]:transition-transform [&_[role=slider]]:duration-200 [&_[role=slider]]:hover:scale-110"
              />
              <div
                className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 pointer-events-none"
                style={{ width: `${pleasantness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* How are you feeling? Title */}
      <h1 className="text-center text-2xl md:text-3xl font-light tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
        How are you feeling?
      </h1>

      {/* Emotion Blobs Row */}
      <div className="flex justify-center gap-3 md:gap-5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        {suggestedEmotions.slice(0, 7).map((em, idx) => (
          <button
            key={em.emotion}
            onClick={() => handleEmotionClick(em.emotion, em.quadrant)}
            className={cn(
              "group relative w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300",
              "hover:scale-110 hover:-translate-y-1 active:scale-95",
              selectedEmotion === em.emotion
                ? "ring-4 ring-offset-2 ring-offset-background scale-110 -translate-y-1"
                : "hover:shadow-xl",
            )}
            style={{
              background: `linear-gradient(135deg, ${QUADRANTS[em.quadrant].color}40, ${QUADRANTS[em.quadrant].color}20)`,
              borderColor: QUADRANTS[em.quadrant].color,
              border: `2px solid ${QUADRANTS[em.quadrant].color}60`,
              animationDelay: `${idx * 50}ms`,
              ringColor: selectedEmotion === em.emotion ? QUADRANTS[em.quadrant].color : undefined,
            }}
          >
            {/* Blob shape with animation */}
            <div
              className="absolute inset-1 rounded-full animate-pulse opacity-40"
              style={{
                background: `radial-gradient(circle, ${QUADRANTS[em.quadrant].color}80 0%, transparent 70%)`,
              }}
            />
            <span className="text-2xl relative z-10">{quadrantEmoji[em.quadrant]}</span>

            {/* Tooltip on hover */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <span
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{
                  color: QUADRANTS[em.quadrant].color,
                  background: `${QUADRANTS[em.quadrant].color}15`,
                }}
              >
                {em.emotion}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Energy & Pleasant Progress Bars */}
      <div className="space-y-4 mb-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        {/* Energy Bar */}
        <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden border border-border/30">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${energy}%`,
              background: `linear-gradient(90deg, ${gradientColors.from}, ${gradientColors.to})`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground/70 drop-shadow-sm">Energy: {energy}%</span>
          </div>
        </div>

        {/* Pleasant Bar */}
        <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden border border-border/30">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pleasantness}%`,
              background: `linear-gradient(90deg, #10B981, #14B8A6)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground/70 drop-shadow-sm">Pleasant: {pleasantness}%</span>
          </div>
        </div>
      </div>

      {/* Bottom: Selected Emotion Label + Continue Button */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        {/* Selected Emotion Display */}
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}10)`,
            borderColor: quadrantInfo.borderColor,
          }}
        >
          <span className="text-2xl">{quadrantEmoji[currentQuadrant]}</span>
          <div>
            <p className="font-semibold text-base" style={{ color: quadrantInfo.color }}>
              {finalEmotion || "Select an emotion"}
            </p>
            <p className="text-xs text-muted-foreground">{quadrantInfo.label}</p>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!finalEmotion}
          size="lg"
          className="h-12 px-8 rounded-2xl text-base gap-2 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
          style={{
            background: finalEmotion
              ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
              : undefined,
          }}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
