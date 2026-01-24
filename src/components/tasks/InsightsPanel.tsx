                  }} axisLine={false} tickLine={false} />
                  <YAxis tick={{
                    fontSize: 8,
                    fill: "hsl(var(--muted-foreground))"
                  }} axisLine={false} tickLine={false} width={14} allowDecimals={false} />
                  <Area type="monotone" dataKey="plan" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#planGradient2)" />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{
                    r: 3,
                    fill: "hsl(var(--chart-1))"
                  }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-lg bg-gradient-to-br from-chart-1/10 to-chart-2/5 border border-chart-1/10 p-2 flex flex-col min-h-0">
            <div className="flex items-center gap-1 mb-1 shrink-0">
              <div className="h-4 w-4 rounded bg-chart-1/20 flex items-center justify-center">
                <Calendar className="h-2.5 w-2.5 text-chart-1" />
              </div>
              <span className="text-[8px] font-semibold text-chart-1 uppercase">Upcoming</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{
                    fontSize: 8,
                    fill: "hsl(var(--muted-foreground))"
                  }} axisLine={false} tickLine={false} />
                  <YAxis tick={{
                    fontSize: 8,
                    fill: "hsl(var(--muted-foreground))"
                  }} axisLine={false} tickLine={false} width={14} allowDecimals={false} />
                  <Bar dataKey="tasks" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Quadrant */}
          <div className="rounded-lg bg-gradient-to-br from-chart-2/10 to-destructive/5 border border-chart-2/10 p-2 flex flex-col min-h-0">
            <div className="flex items-center gap-1 mb-1 shrink-0">
              <div className="h-4 w-4 rounded bg-chart-2/20 flex items-center justify-center">
                <ClockIcon className="h-2.5 w-2.5 text-chart-2" />
              </div>
              <span className="text-[9px] font-semibold text-chart-2 uppercase">Priority</span>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center">
              {quadrantData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={quadrantData} cx="50%" cy="50%" innerRadius={18} outerRadius={36} paddingAngle={3} dataKey="value">
                    {quadrantData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer> : <p className="text-[8px] text-muted-foreground">No data</p>}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>;
