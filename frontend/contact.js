const contactForm = document.getElementById("contact_form");
const handleFormSubmission = async (e) => 
    {
        e.preventDefault();
        const formData={
            fullName : e.target.querySelector("#fullname").value,
            email : e.target.querySelector("#email").value,
            customerReference : e.target.querySelector("#customer_reference").value,
            priority : e.target.querySelector("#priority").value,
            message : e.target.querySelector("#message").value,
        };
        const jsonEncodedData= JSON.stringify(formData);
        const response = await fetch(e.target.action,{
            method: e.target.method,body:jsonEncodedData ,//whats target action
            body: jsonEncodedData
        }); 

        if(!response.ok){
            throw new Error('Server Error: ${response.status}')
        }
            const result = await response.json();
    if(!result.success) {
        throw new Error(`Result error: ${result.error}`);
    }

    console.log('success: result', result);
    };
    contactForm.addEventListener("submit", handleFormSubmission);