# IoT Data Management System - Major Project Assignment

**SCHOOL OF ENGINEERING - ELECTRICAL ENGINEERING DEPARTMENT**  
**BACHELOR OF ELECTRONICS AND COMPUTER ENGINEERING (BECE5)**  
**INTERNET AND WEB SERVICES (ELE-IWS-521)**  

**Duration:** 1 Month (4 Weeks)  
**Total Marks:** 40% of Module Grade  
**Project Type:** Team-based Major Project (3-4 Students per Team)  
**Submission Deadline:** **27th September 2025** (GitHub code & documentation)  
**Viva & Final Presentation:** **30th September 2025**  

---

## 🎯 PROJECT OVERVIEW

### **Mission**
Design and develop a complete **IoT Data Management System** that connects physical sensors with a web-based dashboard and provides secure APIs for external access.

This project simulates real-world IoT applications such as smart cities, industrial monitoring, agriculture, and environmental sensing.

### **Learning Objectives**
By completing this project, you will:
- Design and implement an IoT data pipeline end-to-end.
- Build secure, scalable Node.js + Express web applications.
- Create RESTful APIs with authentication and authorization.
- Use Swagger to document and test APIs.
- Develop responsive dashboards with HTML, CSS, JS, jQuery, and EJS.
- Apply best practices in security, testing, Git usage, and teamwork.

---

## 📋 TEAM FORMATION & ROLES

- **Team Size:** 3–4 students.  
- **Team Registration Deadline:** Week 1, Day 3.  

**Suggested Roles**  
- **IoT Hardware Engineer:** Sensor setup, device firmware, connectivity.  
- **Backend Developer:** Server, database, API design.  
- **Frontend Developer:** Dashboard, charts, EJS, jQuery.  
- **DevOps/Security Engineer (optional, for 4-person teams):** Deployment and API security.  

---

## 🛠️ TECHNICAL REQUIREMENTS

### **Hardware**
- Controller: Arduino / ESP32 / Raspberry Pi / NodeMCU (any internet-enabled controller).  
- Minimum **3 different sensors**: e.g., temperature & humidity, light, motion.  
- Must transmit data to server via HTTP/HTTPS with JSON payload.  

### **Backend Stack**
- Node.js  
- Express.js  
- body-parser  
- EJS templating  
- Database: MySQL **or** PostgreSQL **or** Firebase (choose one)  
- Authentication: JWT or session-based  
- API documentation: **Swagger/OpenAPI**, available at `/api-docs`  

### **Frontend Stack**
- HTML5, CSS3  
- JavaScript (ES6+), jQuery  
- Chart.js (for visualization)  
- Responsive design (Bootstrap or custom CSS Grid/Flexbox)  
- EJS templates for server-side rendering  

### **Development Tools**
- Git & GitHub  
- npm (Node package manager)  
- Postman (for API testing)  
- VS Code or other IDE  

---

## 📊 PROJECT COMPONENTS & MARKS

### **1. IoT Device Development (20 marks)**
- Connect minimum 3 sensors.  
- Collect, process, and transmit data with device ID & timestamp.  
- Implement error handling and reconnection logic.  

### **2. Backend Development (25 marks)**
- Express.js server with modular routes.  
- Database schema for devices, users, and sensor readings.  
- CRUD APIs for devices and data.  
- Authentication & authorization with JWT/sessions + API keys.  
- Secure coding: prevent SQL injection, validate inputs, sanitize outputs.  

### **3. Frontend Development (15 marks)**
- Dashboard with navigation (EJS templates).  
- Real-time sensor readings (AJAX / polling).  
- Historical charts (Chart.js).  
- Device management (add/remove/list devices).  
- Responsive design for mobile and desktop.  

### **4. API Documentation with Swagger (10 marks)**
- Interactive API docs at `/api-docs`.  
- All endpoints documented with parameters and response examples.  
- Authentication requirements clearly shown.  

**Swagger Explanation**  
Swagger (also called **OpenAPI**) is a tool to describe and test APIs in a visual format.  
- Students must integrate Swagger UI so that visiting `/api-docs` shows a list of available endpoints.  
- Example snippet for devices API:

```yaml
paths:
  /api/devices:
    get:
      summary: Get all registered devices
      responses:
        "200":
          description: A list of devices
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Device"
components:
  schemas:
    Device:
      type: object
      properties:
        device_id:
          type: string
        device_name:
          type: string
        location:
          type: string
```

### **5. Integration & Testing (10 marks)**
- Verify full pipeline: IoT device → API → database → dashboard.  
- API tested with Postman & Swagger.  
- Security testing: authentication, authorization, input validation.  

### **6. Documentation (5 marks)**
- **README.md** with setup instructions.  
- Technical documentation (architecture diagram, database schema, API list).  
- User manual with screenshots.  

### **7. Collaboration & Git Usage (5 marks)**
- Shared GitHub repo with meaningful commits from all members.  
- Feature branches, proper commit messages, pull requests where possible.  
- Repo structured professionally.  

### **8. Demo & Viva (20 marks)**
- 20-minute live demonstration of IoT device, APIs, and dashboard.  
- Show API usage via Swagger or Postman.  
- Q\&A session: each member must present part of the work.  
- Depth of understanding and clarity of explanation will be strongly weighted.  

---

## 📊 FINAL MARKING SCHEME

| Component                   | Marks   |
| --------------------------- | ------- |
| IoT Device Development      | 20      |
| Backend Development         | 25      |
| Frontend Development        | 15      |
| API Documentation (Swagger) | 10      |
| Integration & Testing       | 10      |
| Documentation               | 5       |
| Collaboration & Git Usage   | 5       |
| Demo & Viva                 | 20      |
| **TOTAL**                   | **100** |

---

## 📅 TIMELINE & DEADLINES

* **Week 1:** Team formation, design, database schema, architecture.  
* **Week 2:** Backend APIs, IoT device setup.  
* **Week 3:** Frontend dashboard, integration.  
* **Week 4:** Testing, documentation, polish, deployment prep.  
* **27th September 2025:** Final code & documentation submission on GitHub.  
* **30th September 2025:** Viva & final presentation (mandatory).  

---

## ⚠️ POLICIES & GUIDELINES

* **Academic Integrity:** Work must be original. No copying from other teams.  
* **Collaboration:** Only within your assigned team.  
* **Security:** Passwords must be hashed (bcrypt). Input validation required.  
* **Late Submission:** Penalized according to university policy.  
* **Hardware Safety:** Follow safe electrical practices when working with IoT devices.  

---

## 🎯 FINAL NOTE

This project is your **capstone assignment** worth 40% of the module.  
You must start everything **from scratch**:

* IoT device firmware  
* Node.js + Express backend  
* Database schema  
* APIs and Swagger docs  
* Frontend dashboard  

Treat this like building a real IoT product for industry: **secure, documented, tested, and deployable**.

**Build something professional that you’d be proud to showcase in your final-year portfolio 🚀**
