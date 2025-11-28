document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/data")
    .then((res) => res.json())
    .then((data) => {
      const { dates, total, authors } = data;

      const totalCtx = document.getElementById("totalChart").getContext("2d");
      new Chart(totalCtx, {
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
              labels: {
                color: "#e5e7eb",
              },
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

      new Chart(authorCtx, {
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
              labels: {
                color: "#e5e7eb",
              },
            },
          },
        },
      });

      const focusSelect = document.getElementById("focusAuthorSelect");
      const focusAuthorNames = Object.keys(authors);
      let focusChart = null;
      let zeroChart = null;

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
                    labels: {
                      color: "#e5e7eb",
                    },
                  },
                },
              },
            });
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
                    labels: {
                      color: "#e5e7eb",
                    },
                  },
                },
              },
            });
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
