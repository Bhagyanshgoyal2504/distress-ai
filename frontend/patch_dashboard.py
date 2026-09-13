import os

file_path = "src/app/dashboard/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Change the grid from 3 to 4 columns for the top section
content = content.replace(
    'className="xl:col-span-3 grid lg:grid-cols-3 gap-8"',
    'className="xl:col-span-3 grid lg:grid-cols-4 gap-8"'
)

# Also import Brain/Sparkles if needed, but let's just use MessageSquare or Activity
new_card = """          </div>

          {/* AI Insights Section */}
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-white backdrop-blur-xl p-8 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-200/40 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">AI Insights</h3>
            </div>
            {latestStat && latestStat.advice ? (
              <p className="text-slate-600 font-medium leading-relaxed overflow-y-auto">
                {latestStat.advice}
              </p>
            ) : (
              <p className="text-slate-400 font-medium my-auto text-center italic">
                Take an assessment or chat with the AI to receive personalized insights.
              </p>
            )}
          </div>
        </motion.div>"""

content = content.replace(
    '          </div>\n        </motion.div>',
    new_card
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Dashboard patched successfully!")
