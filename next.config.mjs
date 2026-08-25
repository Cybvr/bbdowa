/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/people.html", destination: "/people", permanent: true },
      { source: "/careers.html", destination: "/careers", permanent: true },
      { source: "/projects.html", destination: "/projects", permanent: true },
      { source: "/project.html", destination: "/projects", permanent: true },
      { source: "/clients.html", destination: "/projects", permanent: true },
      { source: "/products.html", destination: "/products", permanent: true },
      { source: "/product.html", destination: "/products", permanent: true },
      { source: "/industry-labs.html", destination: "/products/industry-labs", permanent: true },
      { source: "/agency-workflow.html", destination: "/workflows/agency", permanent: true },
      { source: "/checklist.html", destination: "/workflows/pitch", permanent: true },
      { source: "/resources.html", destination: "/resources", permanent: true },
    ];
  },
};

export default nextConfig;
