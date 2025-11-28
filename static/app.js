document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
      tabContents.forEach((c) => {
        c.classList.toggle("active", c.id === `tab-${tab}`);
      });
    });
  });

  // Repo switcher
  const repoForm = document.getElementById("repoForm");
  const repoInput = document.getElementById("repoInput");

  if (repoForm && repoInput) {
    repoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = repoInput.value.trim();
      if (!url) {
        return;
      }

      fetch("/api/set_repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
        .then((res) =>
          res.json().then((body) => ({
            ok: res.ok,
            body,
          })),
        )
        .then(({ ok, body }) => {
          if (!ok) {
            const message = body && body.error ? body.error : "Failed to load repository";
            // eslint-disable-next-line no-alert
            alert(message);
            return;
          }
          window.location.reload();
        })
        .catch((err) => {
          console.error("Failed to set repo", err);
          // eslint-disable-next-line no-alert
          alert("Failed to load repository");
        });
    });
  }

  fetch("/api/data")
    .then((res) => res.json())
    .then((data) => {
      const { dates, total, authors, meta } = data;

      // Summary stats
      const totalCommits = total.reduce((sum, v) => sum + v, 0);
      const authorNamesAll = Object.keys(authors);
      const authorCount = authorNamesAll.length;
      const commitsPerAuthor = authorCount > 0 ? totalCommits / authorCount : 0;
      const lastWeekTotals = total.slice(-7);
      const commitsLastWeek = lastWeekTotals.reduce((sum, v) => sum + v, 0);

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };

      setText("statTotalCommits", totalCommits.toLocaleString());
      setText("statAuthors", authorCount.toLocaleString());
      setText("statCommitsPerAuthor", commitsPerAuthor.toFixed(1));
      setText(
        "statCommitsPerAuthorSub",
        authorCount ? `avg across ${authorCount} authors` : ""
      );
      setText("statCommitsLast7Days", commitsLastWeek.toLocaleString());

      // Last commit + top authors
      const metaInfo = meta || {};
      const lastCommit = metaInfo.last_commit || null;
      const authorTotals = metaInfo.author_totals || {};

      if (lastCommit && lastCommit.timestamp && lastCommit.author) {
        const lastDate = new Date(lastCommit.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - lastDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const days = Math.floor(diffMins / (60 * 24));
        const hours = Math.floor((diffMins - days * 60 * 24) / 60);
        const mins = diffMins - days * 60 * 24 - hours * 60;

        const ageParts = [];
        if (days) ageParts.push(`${days}d`);
        if (hours || days) ageParts.push(`${hours}h`);
        ageParts.push(`${mins}m`);
        const ageLabel = `${ageParts.join("")} ago`;

        setText("statLastCommitAuthor", lastCommit.author);
        setText(
          "statLastCommitWhen",
          `${lastDate.toISOString().slice(0, 10)} (${ageLabel})`,
        );
      } else {
        setText("statLastCommitAuthor", "–");
        setText("statLastCommitWhen", "");
      }

      const topAuthors = Object.entries(authorTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      topAuthors.forEach(([name, count], index) => {
        const slot = index + 1;
        const linkEl = document.getElementById(`topAuthor${slot}Name`);
        const commitsEl = document.getElementById(`topAuthor${slot}Commits`);
        if (!linkEl || !commitsEl) return;

        if (!name) {
          linkEl.textContent = "–";
          linkEl.removeAttribute("href");
          commitsEl.textContent = "";
          return;
        }

        const profileUrl = `https://github.com/search?q=${encodeURIComponent(
          name,
        )}&type=users`;
        linkEl.textContent = name;
        linkEl.href = profileUrl;
        linkEl.target = "_blank";
        linkEl.rel = "noreferrer";
        commitsEl.textContent = `${count.toLocaleString()} commits`;
      });

      const makeBrushable = (chart) => {
        if (!chart || !chart.canvas || !chart.scales || !chart.scales.x) return;
        const canvas = chart.canvas;
        let isDragging = false;
        let startValue = null;

        const getXValue = (event) => {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const scale = chart.scales.x;
          return scale.getValueForPixel(x);
        };

        canvas.addEventListener("mousedown", (e) => {
          isDragging = true;
          startValue = getXValue(e);
        });

        canvas.addEventListener("mouseup", (e) => {
          if (!isDragging) return;
          isDragging = false;
          const endValue = getXValue(e);
          if (startValue == null || endValue == null) return;

          let min = startValue;
          let max = endValue;
          if (min > max) {
            [min, max] = [max, min];
          }
          if (Math.abs(max - min) < 1) {
            return;
          }

          chart.options.scales.x.min = min;
          chart.options.scales.x.max = max;
          chart.update();
        });

        canvas.addEventListener("dblclick", () => {
          chart.options.scales.x.min = undefined;
          chart.options.scales.x.max = undefined;
          chart.update();
        });
      };

      const totalCtx = document.getElementById("totalChart").getContext("2d");
      const totalChart = new Chart(totalCtx, {
        type: "line",
        data: {
          labels: dates,
          datasets: [
            {
              label: "Commits per day",
              data: total,
              borderColor: "rgba(54, 162, 235, 1)",
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Date",
              },
              ticks: {
                color: "#9ca3af",
                maxRotation: 90,
                minRotation: 90,
              },
              grid: {
                color: "rgba(55, 65, 81, 0.5)",
              },
            },
            y: {
              title: {
                display: true,
                text: "Commits",
              },
              beginAtZero: true,
              ticks: {
                color: "#9ca3af",
              },
              grid: {
                color: "rgba(55, 65, 81, 0.5)",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });

      const authorCtx = document.getElementById("authorChart").getContext("2d");
      const palette = [
        "rgba(255, 99, 132, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(255, 205, 86, 1)",
        "rgba(153, 102, 255, 1)",
        "rgba(201, 203, 207, 1)",
      ];

      const authorNames = Object.keys(authors);
      const authorDatasets = authorNames.map((author, idx) => {
        const color = palette[idx % palette.length];
        return {
          label: author,
          data: authors[author],
          borderColor: color,
          backgroundColor: color.replace("1)", "0.2)"),
          tension: 0.1,
        };
      });

      const authorChart = new Chart(authorCtx, {
        type: "line",
        data: {
          labels: dates,
          datasets: authorDatasets,
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Date",
              },
              ticks: {
                color: "#9ca3af",
                maxRotation: 90,
                minRotation: 90,
              },
              grid: {
                color: "rgba(55, 65, 81, 0.5)",
              },
            },
            y: {
              title: {
                display: true,
                text: "Commits",
              },
              beginAtZero: true,
              ticks: {
                color: "#9ca3af",
              },
              grid: {
                color: "rgba(55, 65, 81, 0.5)",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
      makeBrushable(totalChart);
      makeBrushable(authorChart);

      const focusSelect = document.getElementById("focusAuthorSelect");
      const focusAuthorNames = Object.keys(authors);
      let focusChart = null;
      let zeroChart = null;

      const setFocusStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };

      const computeFocusStats = (series) => {
        const total = series.reduce((sum, v) => sum + v, 0);

        let lastIdx = -1;
        for (let i = series.length - 1; i >= 0; i -= 1) {
          if (series[i] > 0) {
            lastIdx = i;
            break;
          }
        }
        const lastDateStr = lastIdx >= 0 ? dates[lastIdx] : null;

        let last7 = 0;
        let thisMonth = 0;
        if (dates.length > 0) {
          const maxDate = new Date(dates[dates.length - 1]);
          const weekAgo = new Date(maxDate);
          weekAgo.setDate(maxDate.getDate() - 6);
          const monthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

          for (let i = 0; i < series.length; i += 1) {
            const v = series[i];
            if (v === 0) continue;
            const d = new Date(dates[i]);
            if (d >= weekAgo && d <= maxDate) {
              last7 += v;
            }
            if (d >= monthStart && d <= maxDate) {
              thisMonth += v;
            }
          }
        }

        setFocusStat("focusLastCommit", lastDateStr || "–");
        setFocusStat("focusTotalCommits", total.toLocaleString());
        setFocusStat("focusCommitsLast7Days", last7.toLocaleString());
        setFocusStat("focusCommitsThisMonth", thisMonth.toLocaleString());
      };

      if (focusSelect && focusAuthorNames.length > 0) {
        focusAuthorNames
          .slice()
          .sort((a, b) => a.localeCompare(b))
          .forEach((author) => {
            const option = document.createElement("option");
            option.value = author;
            option.textContent = author;
            focusSelect.appendChild(option);
          });

        const makeFocusCharts = (focusAuthor) => {
          const series = authors[focusAuthor];
          if (!series) {
            return;
          }

          computeFocusStats(series);

          if (!focusChart) {
            const focusCtx = document.getElementById("focusAuthorChart").getContext("2d");
            focusChart = new Chart(focusCtx, {
              type: "line",
              data: {
                labels: dates,
                datasets: [
                  {
                    label: focusAuthor,
                    data: series,
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    tension: 0.1,
                  },
                ],
              },
              options: {
                responsive: true,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "Date",
                    },
                    ticks: {
                      color: "#9ca3af",
                      maxRotation: 90,
                      minRotation: 90,
                    },
                    grid: {
                      color: "rgba(55, 65, 81, 0.5)",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Commits",
                    },
                    beginAtZero: true,
                    ticks: {
                      color: "#9ca3af",
                    },
                    grid: {
                      color: "rgba(55, 65, 81, 0.5)",
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              },
            });
            makeBrushable(focusChart);
          } else {
            focusChart.data.labels = dates;
            focusChart.data.datasets[0].label = focusAuthor;
            focusChart.data.datasets[0].data = series;
            focusChart.update();
          }

          const zeroSeries = series.map((v) => (v === 0 ? 1 : 0));

          if (!zeroChart) {
            const zeroCtx = document.getElementById("focusAuthorZeroChart").getContext("2d");
            zeroChart = new Chart(zeroCtx, {
              type: "bar",
              data: {
                labels: dates,
                datasets: [
                  {
                    label: "Zero-commit day (1 = no commits)",
                    data: zeroSeries,
                    backgroundColor: "rgba(248, 113, 113, 0.6)",
                    borderColor: "rgba(248, 113, 113, 1)",
                  },
                ],
              },
              options: {
                responsive: true,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "Date",
                    },
                    ticks: {
                      color: "#9ca3af",
                      maxRotation: 90,
                      minRotation: 90,
                    },
                    grid: {
                      color: "rgba(55, 65, 81, 0.5)",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Zero-commit flag",
                    },
                    beginAtZero: true,
                    suggestedMax: 1,
                    ticks: {
                      stepSize: 1,
                      color: "#9ca3af",
                    },
                    grid: {
                      color: "rgba(55, 65, 81, 0.5)",
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              },
            });
            makeBrushable(zeroChart);
          } else {
            zeroChart.data.labels = dates;
            zeroChart.data.datasets[0].data = zeroSeries;
            zeroChart.update();
          }
        };

        focusSelect.addEventListener("change", (e) => {
          const selectedAuthor = e.target.value;
          if (selectedAuthor) {
            makeFocusCharts(selectedAuthor);
          }
        });

        // Default to the first author in the sorted list
        const defaultAuthor = focusAuthorNames.slice().sort((a, b) => a.localeCompare(b))[0];
        focusSelect.value = defaultAuthor;
        makeFocusCharts(defaultAuthor);
      }
    })
    .catch((err) => {
      console.error("Failed to load data", err);
    });
});
